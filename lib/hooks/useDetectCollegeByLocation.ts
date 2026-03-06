import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { College } from "@/lib/types";
import { calculateDistance } from "@/lib/utils";

interface LocationHookState {
    isLocating: boolean;
    detectedCollege: College | null;
    error: string | null;
}

export function useDetectCollegeByLocation() {
    const [state, setState] = useState<LocationHookState>({
        isLocating: false,
        detectedCollege: null,
        error: null,
    });

    const detectLocation = async () => {
        setState({ isLocating: true, detectedCollege: null, error: null });

        if (!navigator.geolocation) {
            setState({ isLocating: false, detectedCollege: null, error: "Geolocation is not supported by your browser" });
            return;
        }

        const getLocationPromise = () => new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 2000, // 2-second timeout per spec
                maximumAge: 0
            });
        });

        try {
            const position = await getLocationPromise();
            const { latitude, longitude, accuracy } = position.coords;

            if (accuracy > 1000) {
                // If it's wildly inaccurate, reject
                setState({ isLocating: false, detectedCollege: null, error: "Location inaccurate. Please select manually." });
                return;
            }

            // Fetch colleges (for MVP, fetch all or a subset, assuming small DB initially)
            if (!db) throw new Error("Firestore not initialized");

            const collegesSnap = await getDocs(collection(db, "colleges"));
            const colleges: College[] = collegesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as College));

            let closestCollege: College | null = null;
            let minDistance = Infinity;

            colleges.forEach(college => {
                const distance = calculateDistance(latitude, longitude, college.lat, college.lng);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCollege = college;
                }
            });

            if (closestCollege && minDistance <= (closestCollege as College).radiusMeters) {
                setState({ isLocating: false, detectedCollege: closestCollege, error: null });
            } else {
                setState({ isLocating: false, detectedCollege: null, error: "No college found near your location." });
            }

        } catch (err: any) {
            console.error("Geolocation error:", err);
            let errorMessage = "Failed to detect location.";
            if (err.code === 1) errorMessage = "Location permission denied.";
            if (err.code === 2) errorMessage = "Location unavailable.";
            if (err.code === 3) errorMessage = "Location request timed out. Please select manually.";
            setState({ isLocating: false, detectedCollege: null, error: errorMessage });
        }
    };

    const resetDetection = () => {
        setState({ isLocating: false, detectedCollege: null, error: null });
    }

    return { ...state, detectLocation, resetDetection };
}
