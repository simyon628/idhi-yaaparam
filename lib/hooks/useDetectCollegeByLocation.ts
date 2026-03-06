import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { College } from "@/lib/types";

interface LocationHookState {
    isLocating: boolean;
    isTakingLong: boolean;
    detectedCollege: College | null;
    error: string | null;
}

export function useDetectCollegeByLocation() {
    const [state, setState] = useState<LocationHookState>({
        isLocating: false,
        isTakingLong: false,
        detectedCollege: null,
        error: null,
    });

    const detectLocation = async () => {
        setState({ isLocating: true, isTakingLong: false, detectedCollege: null, error: null });

        if (!navigator.geolocation) {
            setState({ isLocating: false, isTakingLong: false, detectedCollege: null, error: "Geolocation is not supported by your browser" });
            return;
        }

        let isTakingLongTimeout = setTimeout(() => {
            setState(s => ({ ...s, isTakingLong: true }));
        }, 3000);

        const getLocationPromise = () => new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            });
        });

        try {
            const position = await getLocationPromise();
            clearTimeout(isTakingLongTimeout);

            const { latitude, longitude, accuracy } = position.coords;

            // Optional: warn on very low accuracy but don't strictly block yet if Nominatim can still resolve it broadly
            if (accuracy > 5000) {
                console.warn("Location accuracy is low:", accuracy);
            }

            // 1. Reverse Geocode via Nominatim
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'IdhiYaaparam/1.0 (Student Project)' // Nominatim requires a User-Agent
                }
            });

            if (!response.ok) {
                throw new Error(`Reverse geocoding failed with status ${response.status}`);
            }

            const data = await response.json();

            // Extract potential institution names from Nominatim response
            // Nominatim might put it in different keys depending on the POI type
            const address = data.address || {};
            const placeName = address.university || address.college || address.school || address.amenity || data.name;

            if (!placeName) {
                setState({ isLocating: false, isTakingLong: false, detectedCollege: null, error: "We couldn't detect your college automatically." });
                return;
            }

            // 2. Fetch all our curated colleges to find a match (since it's a small controlled dataset)
            if (!db) throw new Error("Firestore not initialized");

            const collegesSnap = await getDocs(collection(db, "colleges"));
            if (collegesSnap.empty) {
                setState({ isLocating: false, isTakingLong: false, detectedCollege: null, error: "Our college database is currently empty." });
                return;
            }

            const allColleges = collegesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as College));

            // 3. Match reverse-geocoded place name against our Firestore list
            // We use a flexible match since Nominatim might return "NRI Institute of Technology" and DB might have "NRI Institute"
            const normalizedPlaceName = placeName.toLowerCase();

            const matchedCollege = allColleges.find(c => {
                const normalizedDbName = c.name.toLowerCase();
                // Check if the map name contains our DB name, or our DB name contains the map name
                return normalizedPlaceName.includes(normalizedDbName) || normalizedDbName.includes(normalizedPlaceName);
            });

            if (matchedCollege) {
                // We found a direct programmatic match in our system!
                setState({
                    isLocating: false,
                    isTakingLong: false,
                    detectedCollege: matchedCollege,
                    error: null
                });
            } else {
                // The map found *a* place, but it isn't in our Firestore system. 
                setState({
                    isLocating: false,
                    isTakingLong: false,
                    detectedCollege: null,
                    error: `We detected "${placeName}" near you, but it isn't in our active marketplace yet.`
                });
            }

        } catch (err: any) {
            console.error("Geolocation error:", err);
            let errorMessage = "Failed to detect location.";
            if (err.code === 1) errorMessage = "Location permission denied.";
            if (err.code === 2) errorMessage = "Location unavailable.";
            if (err.code === 3) errorMessage = "Location request timed out. Please select manually.";
            setState({ isLocating: false, isTakingLong: false, detectedCollege: null, error: errorMessage });
        }
    };

    const resetDetection = () => {
        setState({ isLocating: false, isTakingLong: false, detectedCollege: null, error: null });
    }

    return { ...state, detectLocation, resetDetection };
}
