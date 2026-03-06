import { useState } from "react";
import { College } from "@/lib/types";
import { getLocalColleges } from "@/lib/utils/colleges";

interface LocationHookState {
    isLocating: boolean;
    isTakingLong: boolean;
    detectedCollege: College | null;
    nearbyColleges: College[]; // Multiple colleges nearby (user picks one)
    error: string | null;
}

// Haversine formula to find distance between two lat/lon points in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useDetectCollegeByLocation() {
    const [state, setState] = useState<LocationHookState>({
        isLocating: false,
        isTakingLong: false,
        detectedCollege: null,
        nearbyColleges: [],
        error: null,
    });

    const detectLocation = async () => {
        setState({ isLocating: true, isTakingLong: false, detectedCollege: null, nearbyColleges: [], error: null });

        if (!navigator.geolocation) {
            setState({ isLocating: false, isTakingLong: false, detectedCollege: null, nearbyColleges: [], error: "Geolocation is not supported by your browser." });
            return;
        }

        const takingLongTimeout = setTimeout(() => {
            setState(s => ({ ...s, isTakingLong: true }));
        }, 4000);

        const getPositionPromise = () => new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            });
        });

        try {
            const position = await getPositionPromise();
            clearTimeout(takingLongTimeout);

            const { latitude, longitude } = position.coords;
            console.log("📍 GPS got coordinates:", { latitude, longitude });

            // ============================================================
            // STEP 1: Overpass API — "give me all universities and colleges
            //         within a 2km radius of this GPS point"
            //         This is how Rapido/Uber detect nearby places.
            // ============================================================
            const RADIUS_METERS = 2000; // 2km radius
            const overpassQuery = `
                [out:json][timeout:15];
                (
                  node["amenity"~"university|college"]["name"](around:${RADIUS_METERS},${latitude},${longitude});
                  way["amenity"~"university|college"]["name"](around:${RADIUS_METERS},${latitude},${longitude});
                  relation["amenity"~"university|college"]["name"](around:${RADIUS_METERS},${latitude},${longitude});
                );
                out center tags;
            `;

            const overpassUrl = "https://overpass-api.de/api/interpreter";
            const overpassResponse = await fetch(overpassUrl, {
                method: "POST",
                body: overpassQuery,
                headers: { "Content-Type": "text/plain" },
            });

            if (!overpassResponse.ok) {
                throw new Error(`Overpass API failed: ${overpassResponse.status}`);
            }

            const overpassData = await overpassResponse.json();
            console.log("🗺️ Overpass found nearby elements:", overpassData.elements?.length ?? 0);

            // Extract names and coordinates from Overpass results
            const nearbyFromMap: { name: string; lat: number; lon: number; distanceM: number }[] = [];

            for (const el of overpassData.elements ?? []) {
                const name = el.tags?.name;
                if (!name) continue;
                const elLat = el.lat ?? el.center?.lat ?? 0;
                const elLon = el.lon ?? el.center?.lon ?? 0;
                const distanceM = getDistanceMeters(latitude, longitude, elLat, elLon);
                nearbyFromMap.push({ name, lat: elLat, lon: elLon, distanceM });
            }

            // Sort by closest first
            nearbyFromMap.sort((a, b) => a.distanceM - b.distanceM);
            console.log("🎯 Sorted nearby colleges from Overpass:", nearbyFromMap.map(n => `${n.name} (${Math.round(n.distanceM)}m)`));

            if (nearbyFromMap.length === 0) {
                setState({
                    isLocating: false, isTakingLong: false, detectedCollege: null, nearbyColleges: [],
                    error: "No colleges detected nearby. Please enter your college manually.",
                });
                return;
            }

            // ============================================================
            // STEP 2: Match the map results to our local CSV college list
            //         using bidirectional substring matching.
            // ============================================================
            const allLocalColleges = await getLocalColleges();

            const matchedAndRanked: College[] = [];
            const seenIds = new Set<string>();

            for (const nearby of nearbyFromMap) {
                const normalizedMapName = nearby.name.toLowerCase();

                // Try to find this map result in our curated CSV
                const csvMatch = allLocalColleges.find(col => {
                    const normalizedCsvName = col.name.toLowerCase();
                    return normalizedMapName.includes(normalizedCsvName) || normalizedCsvName.includes(normalizedMapName);
                });

                if (csvMatch && !seenIds.has(csvMatch.id)) {
                    // CSV match found — use the clean curated name
                    matchedAndRanked.push(csvMatch);
                    seenIds.add(csvMatch.id);
                } else if (!csvMatch) {
                    // College is near the user but not in our CSV — create a synthetic entry
                    // This ensures the user can still select it (we show the map name directly)
                    const syntheticId = `map-${nearby.name.toLowerCase().replace(/\s+/g, "-")}`;
                    if (!seenIds.has(syntheticId)) {
                        matchedAndRanked.push({
                            id: syntheticId,
                            name: nearby.name,
                            state: "",
                            city: "",
                            lat: nearby.lat,
                            lng: nearby.lon,
                        } as College);
                        seenIds.add(syntheticId);
                    }
                }
            }

            console.log("✅ Final matched colleges:", matchedAndRanked.map(c => c.name));

            if (matchedAndRanked.length === 1) {
                // Only one college nearby — confirm it automatically like Rapido
                setState({ isLocating: false, isTakingLong: false, detectedCollege: matchedAndRanked[0], nearbyColleges: [], error: null });
            } else if (matchedAndRanked.length > 1) {
                // Multiple colleges nearby — show a picker (like when you're near campus gates area)
                setState({ isLocating: false, isTakingLong: false, detectedCollege: null, nearbyColleges: matchedAndRanked, error: null });
            } else {
                setState({
                    isLocating: false, isTakingLong: false, detectedCollege: null, nearbyColleges: [],
                    error: "We couldn't match a college at your location. Please enter manually.",
                });
            }

        } catch (err: unknown) {
            clearTimeout(takingLongTimeout);
            console.error("Location detection error:", err);

            let errorMessage = "Failed to detect location. Please select manually.";
            if (err && typeof err === "object" && "code" in err) {
                const code = (err as GeolocationPositionError).code;
                if (code === 1) errorMessage = "Location permission denied. Please enable location access and try again.";
                if (code === 2) errorMessage = "Location unavailable. Please select manually.";
                if (code === 3) errorMessage = "Location request timed out. Please select manually.";
            }

            setState({ isLocating: false, isTakingLong: false, detectedCollege: null, nearbyColleges: [], error: errorMessage });
        }
    };

    const resetDetection = () => {
        setState({ isLocating: false, isTakingLong: false, detectedCollege: null, nearbyColleges: [], error: null });
    };

    return { ...state, detectLocation, resetDetection };
}
