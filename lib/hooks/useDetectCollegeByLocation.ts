import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { College } from "@/lib/types";
import { calculateDistance } from "@/lib/utils";

interface LocationHookState {
    isLocating: boolean;
    isTakingLong: boolean;
    detectedCollege: College | null;
    distanceMeters: number | null;
    error: string | null;
}

export function useDetectCollegeByLocation() {
    const [state, setState] = useState<LocationHookState>({
        isLocating: false,
        isTakingLong: false,
        detectedCollege: null,
        distanceMeters: null,
        error: null,
    });

    const detectLocation = async () => {
        setState({ isLocating: true, isTakingLong: false, detectedCollege: null, distanceMeters: null, error: null });

        if (!navigator.geolocation) {
            setState({ isLocating: false, isTakingLong: false, detectedCollege: null, distanceMeters: null, error: "Geolocation is not supported by your browser" });
            return;
        }

        let isTakingLongTimeout = setTimeout(() => {
            setState(s => ({ ...s, isTakingLong: true }));
        }, 2000);

        const getLocationPromise = () => new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        try {
            const position = await getLocationPromise();
            clearTimeout(isTakingLongTimeout);

            const { latitude, longitude, accuracy } = position.coords;

            if (accuracy > 1000) {
                setState({ isLocating: false, isTakingLong: false, detectedCollege: null, distanceMeters: null, error: "Location inaccurate. Please select manually." });
                return;
            }

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
                setState({ isLocating: false, isTakingLong: false, detectedCollege: closestCollege, distanceMeters: Math.round(minDistance), error: null });
            } else {
                setState({ isLocating: false, isTakingLong: false, detectedCollege: null, distanceMeters: null, error: "We couldn’t match your college by location. Please search and select it manually." });
            }

        } catch (err: any) {
            clearTimeout(isTakingLongTimeout);
            console.error("Geolocation error:", err);
            let errorMessage = "Failed to detect location.";
            if (err.code === 1) errorMessage = "Location permission denied.";
            if (err.code === 2) errorMessage = "Location unavailable.";
            if (err.code === 3) errorMessage = "Location is taking longer than expected. You can select your college manually below.";
            setState({ isLocating: false, isTakingLong: false, detectedCollege: null, distanceMeters: null, error: errorMessage });
        }
    };

    const resetDetection = () => {
        setState({ isLocating: false, isTakingLong: false, detectedCollege: null, distanceMeters: null, error: null });
    }

    return { ...state, detectLocation, resetDetection };
}
