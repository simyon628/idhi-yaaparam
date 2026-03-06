import { useState } from "react";
import { College } from "@/lib/types";
import { getLocalColleges } from "@/lib/utils/colleges";

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
            console.log("📍 GPS Coordinates detected:", { latitude, longitude, accuracy });

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
            console.log("🗺️ Nominatim Response Data:", data);

            // Extract potential institution names from Nominatim response
            // Nominatim might put it in different keys depending on the POI type
            const address = data.address || {};
            const possibleNames = [
                address.university,
                address.college,
                address.school,
                address.amenity,
                data.name,
                address.village,
                address.suburb,
                address.city,
                address.town,
                address.neighbourhood,
                address.road
            ].filter(Boolean);
            console.log("🔍 Possible Names from Nominatim:", possibleNames);

            const placeName = address.university || address.college || address.school || address.amenity || data.name;

            if (!placeName) {
                setState({ isLocating: false, isTakingLong: false, detectedCollege: null, error: "We couldn't detect your college automatically." });
                return;
            }

            // 2. Fetch all our curated colleges to find a match
            const allColleges = await getLocalColleges();

            if (allColleges.length === 0) {
                setState({ isLocating: false, isTakingLong: false, detectedCollege: null, error: "Our college database is currently unavailable." });
                return;
            }

            // 3. Match reverse-geocoded place names against our Firestore list
            const matchedCollege = allColleges.find(col => {
                const normalizedDbName = col.name.toLowerCase();
                // Check if ANY of the possible names from Nominatim contain our DB name, or vice versa
                return possibleNames.some(nameFromMap => {
                    const normalizedMapName = nameFromMap.toLowerCase();
                    return normalizedMapName.includes(normalizedDbName) || normalizedDbName.includes(normalizedMapName);
                });
            });

            if (matchedCollege) {
                console.log("✅ Matched Nominatim place to Firestore College:", matchedCollege.name);
                // We found a direct programmatic match in our system!
                setState({
                    isLocating: false,
                    isTakingLong: false,
                    detectedCollege: matchedCollege,
                    error: null
                });
            } else {
                console.warn("⚠️ No match found in database for detected places:", possibleNames);
                // The map found *a* place, but it isn't in our Firestore system. 
                setState({
                    isLocating: false,
                    isTakingLong: false,
                    detectedCollege: null,
                    error: `We detected "${possibleNames[0]}" near you, but it isn't in our active marketplace yet.`
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
