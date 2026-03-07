import { useState } from "react";

// A college candidate returned from Overpass, enriched with distance
export interface NearbyCandidate {
    id: string;       // OSM element id
    name: string;     // tags.name
    lat: number;
    lon: number;
    amenity: string;  // college | university | school
    distanceM: number; // metres from the user
}

interface State {
    isLocating: boolean;
    isTakingLong: boolean;
    candidates: NearbyCandidate[];   // distance-sorted, max 10
    error: string | null;
}

// ── Haversine distance in metres ──────────────────────────────────────────────
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Overpass QL query ─────────────────────────────────────────────────────────
function buildQuery(lat: number, lon: number, radius: number): string {
    return `
[out:json][timeout:10];
(
  node(around:${radius},${lat},${lon})[amenity=college];
  node(around:${radius},${lat},${lon})[amenity=university];
  node(around:${radius},${lat},${lon})[amenity=school];
  way(around:${radius},${lat},${lon})[amenity=college];
  way(around:${radius},${lat},${lon})[amenity=university];
  way(around:${radius},${lat},${lon})[amenity=school];
);
out center;
`.trim();
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useDetectCollegeByLocation() {
    const [state, setState] = useState<State>({
        isLocating: false,
        isTakingLong: false,
        candidates: [],
        error: null,
    });

    const detectLocation = async () => {
        setState({ isLocating: true, isTakingLong: false, candidates: [], error: null });

        if (!navigator.geolocation) {
            setState({
                isLocating: false, isTakingLong: false, candidates: [],
                error: "Geolocation is not supported by your browser.",
            });
            return;
        }

        // Show "taking long" hint after 4 s
        const slowTimer = setTimeout(() =>
            setState(s => ({ ...s, isTakingLong: true })), 4_000);

        // GPS promise
        const getPosition = () =>
            new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15_000,
                    maximumAge: 0,
                })
            );

        try {
            const position = await getPosition();
            clearTimeout(slowTimer);

            const { latitude: lat, longitude: lon } = position.coords;
            console.log("📍 GPS:", { lat, lon });

            // ── Overpass call with 9-second client-side timeout ────────────
            const RADIUS = 1500; // metres – not exposed in UI copy
            const controller = new AbortController();
            const overpassTimer = setTimeout(() => controller.abort(), 9_000);

            let overpassData: {
                elements?: Array<{
                    id: number;
                    type: string;
                    lat?: number;
                    lon?: number;
                    center?: { lat: number; lon: number };
                    tags?: Record<string, string>;
                }>
            };

            try {
                const res = await fetch("https://overpass-api.de/api/interpreter", {
                    method: "POST",
                    body: buildQuery(lat, lon, RADIUS),
                    headers: { "Content-Type": "text/plain" },
                    signal: controller.signal,
                });
                clearTimeout(overpassTimer);

                if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
                overpassData = await res.json();
            } catch (fetchErr: unknown) {
                clearTimeout(overpassTimer);
                const isAbort = fetchErr instanceof Error && fetchErr.name === "AbortError";
                throw new Error(
                    isAbort
                        ? "Location service timed out. Please try again or search manually."
                        : "Could not reach the location service. Please search manually."
                );
            }

            console.log("🗺️ Overpass elements:", overpassData.elements?.length ?? 0);

            // ── Parse + compute distance ───────────────────────────────────
            const candidates: NearbyCandidate[] = [];

            for (const el of overpassData.elements ?? []) {
                const name = el.tags?.name;
                if (!name) continue;

                const elLat = el.lat ?? el.center?.lat;
                const elLon = el.lon ?? el.center?.lon;
                if (elLat === undefined || elLon === undefined) continue;

                candidates.push({
                    id: `${el.type}-${el.id}`,
                    name,
                    lat: elLat,
                    lon: elLon,
                    amenity: el.tags?.amenity ?? "",
                    distanceM: haversineM(lat, lon, elLat, elLon),
                });
            }

            // Sort nearest-first, keep top 10, deduplicate by name
            const seen = new Set<string>();
            const sorted = candidates
                .sort((a, b) => a.distanceM - b.distanceM)
                .filter(c => {
                    const key = c.name.toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .slice(0, 10);

            console.log("🎯 Candidates:", sorted.map(c => `${c.name} (${Math.round(c.distanceM)}m)`));

            if (sorted.length === 0) {
                setState({
                    isLocating: false, isTakingLong: false, candidates: [],
                    error: "We couldn't detect any colleges near your location. Please search manually.",
                });
            } else {
                // Always show the list — never auto-select silently
                setState({ isLocating: false, isTakingLong: false, candidates: sorted, error: null });
            }

        } catch (err: unknown) {
            clearTimeout(slowTimer);
            console.error("Detection error:", err);

            const msg = err instanceof Error ? err.message : "Failed to detect location.";
            let errorMessage = msg;

            // Handle native GeolocationPositionError codes
            if (err && typeof err === "object" && "code" in err) {
                const code = (err as GeolocationPositionError).code;
                if (code === 1) errorMessage = "Location permission denied. Please enable it in your browser settings.";
                else if (code === 2) errorMessage = "Location is currently unavailable. Please search manually.";
                else if (code === 3) errorMessage = "Location request timed out. Please search manually.";
            }

            setState({ isLocating: false, isTakingLong: false, candidates: [], error: errorMessage });
        }
    };

    const reset = () =>
        setState({ isLocating: false, isTakingLong: false, candidates: [], error: null });

    return { ...state, detectLocation, reset };
}
