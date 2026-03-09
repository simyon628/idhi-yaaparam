import { useState, useRef, useCallback } from "react";

export interface AutoDetectedCollege {
    id: string;
    name: string;
    lat: number;
    lon: number;
    distanceM: number;
}

type Status = "idle" | "detecting" | "ready" | "failed";

export type DetectionDecision =
    | { mode: 'none' }
    | { mode: 'single'; college: AutoDetectedCollege }
    | { mode: 'multiple'; colleges: AutoDetectedCollege[] };

export function decideCollegeSelectionMode(
    colleges: AutoDetectedCollege[],
    distanceThresholdMeters: number = 300
): DetectionDecision {
    if (!colleges || colleges.length === 0) {
        return { mode: 'none' };
    }

    if (colleges.length === 1) {
        return { mode: 'single', college: colleges[0] };
    }

    const closeColleges = colleges.filter(
        (c) => c.distanceM <= distanceThresholdMeters
    );

    if (closeColleges.length <= 1) {
        return { mode: 'single', college: colleges[0] };
    }

    return { mode: 'multiple', colleges: closeColleges };
}

interface State {
    status: Status;
    decision: DetectionDecision | null;
}

// ── Haversine ────────────────────────────────────────────────────────────────
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6_371_000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Overpass query ───────────────────────────────────────────────────────────
async function fetchNearbyColleges(
    lat: number,
    lon: number,
    signal: AbortSignal
): Promise<AutoDetectedCollege[]> {
    const RADIUS = 1500;
    const query = `
[out:json][timeout:25];
(
  node(around:${RADIUS}, ${lat}, ${lon})["amenity"="college"];
  node(around:${RADIUS}, ${lat}, ${lon})["amenity"="university"];
  way(around:${RADIUS}, ${lat}, ${lon})["amenity"="college"];
  way(around:${RADIUS}, ${lat}, ${lon})["amenity"="university"];
);
out center;
`.trim();

    const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain" },
        signal,
    });

    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    const data: {
        elements?: Array<{
            id: number; type: string;
            lat?: number; lon?: number;
            center?: { lat: number; lon: number };
            tags?: Record<string, string>;
        }>
    } = await res.json();

    const seen = new Set<string>();
    const results: AutoDetectedCollege[] = [];

    for (const el of data.elements ?? []) {
        const name = el.tags?.name || el.tags?.['name:en'];
        if (!name) continue;
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;
        if (elLat === undefined || elLon === undefined) continue;

        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
            id: `${el.type}-${el.id}`,
            name,
            lat: elLat,
            lon: elLon,
            distanceM: haversineM(lat, lon, elLat, elLon),
        });
    }

    return results.sort((a, b) => a.distanceM - b.distanceM);
}

/**
 * Starts background Overpass detection automatically on mount.
 * Runs exactly once per page load. Does not block the UI.
 * Exposes { status, college } for the modal to use.
 */
export function useBackgroundCollegeDetection() {
    const [state, setState] = useState<State>({
        status: "idle",
        decision: null,
    });
    const hasRun = useRef(false); // ensures we never run more than once

    const startDetection = useCallback(() => {
        if (hasRun.current) return;
        if (typeof window === "undefined") return;
        if (!navigator.geolocation) {
            setState({ status: "failed", decision: null });
            return;
        }

        hasRun.current = true;
        setState({ status: "detecting", decision: null });

        const controller = new AbortController();

        // GPS + Overpass pipeline
        const run = async () => {
            try {
                const CACHE_KEY = "idhi-yaaparam-location";
                const cacheStr = localStorage.getItem(CACHE_KEY);
                let lat, lon;

                if (cacheStr) {
                    try {
                        const parsed = JSON.parse(cacheStr);
                        // Check if within 24 hours
                        if (Date.now() - parsed.timestamp < 86400000) {
                            lat = parsed.lat;
                            lon = parsed.lon;
                            console.log("🌏 Using cached location:", { lat, lon });
                        }
                    } catch (e) {
                        // ignore parse errors
                    }
                }

                if (!lat || !lon) {
                    // Step 1 — GPS
                    const position = await new Promise<GeolocationPosition>((resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10_000,
                            maximumAge: 0,
                        })
                    );

                    lat = position.coords.latitude;
                    lon = position.coords.longitude;
                    console.log("🌏 Background GPS:", { lat, lon });

                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        lat,
                        lon,
                        timestamp: Date.now()
                    }));
                }

                // Step 2 — Overpass (10 second window)
                const overpassTimer = setTimeout(() => controller.abort(), 10_000);
                try {
                    const colleges = await fetchNearbyColleges(lat, lon, controller.signal);
                    clearTimeout(overpassTimer);

                    if (colleges.length > 0) {
                        const decision = decideCollegeSelectionMode(colleges, 300);
                        if (decision.mode === "none") {
                            console.log("⚠️ No colleges found near user location");
                            setState({ status: "failed", decision: null });
                        } else {
                            if (decision.mode === "single") {
                                console.log("✅ Background detected (single):", decision.college.name, `(${Math.round(decision.college.distanceM)}m)`);
                            } else {
                                console.log("✅ Background detected (multiple):", decision.colleges.length, "colleges within 300m");
                            }
                            setState({ status: "ready", decision });
                        }
                    } else {
                        console.log("⚠️ No colleges found near user location");
                        setState({ status: "failed", decision: null });
                    }
                } catch {
                    clearTimeout(overpassTimer);
                    setState({ status: "failed", decision: null });
                }
            } catch (err: unknown) {
                // Location denied, unavailable, or timed out — silent fail
                console.log("📍 Background detection failed silently:", err);
                setState({ status: "failed", decision: null });
            }
        };

        run();
    }, []);

    return { ...state, startDetection };
}
