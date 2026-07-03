/* eslint-disable */
import { useState, useEffect } from "react";
import { College } from "@/lib/types";

export interface CampusBlock {
    id: string;
    name: string;
    lat: number;
    lon: number;
}

export function useCampusBlocks(college: College | null | undefined) {
    const [blocks, setBlocks] = useState<CampusBlock[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!college || !college.name) {
            setBlocks([]);
            return;
        }

        // Cache mechanism to avoid spamming Nominatim/Overpass
        const cacheKey = `blocks_${college.id || college.name}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                setBlocks(JSON.parse(cached));
                return;
            } catch (e) {
                // Ignore parse errors and fetch fresh
            }
        }

        const isMounted = true;
        setLoading(true);
        setError(null);

        // SIMPLIFIED SCOPE: Bypass Overpass entirely and return generic blocks.
        const staticBlocks: CampusBlock[] = [
            { id: "b1", name: "Main Block", lat: 0, lon: 0 },
            { id: "b2", name: "Library", lat: 0, lon: 0 },
            { id: "b3", name: "Hostels", lat: 0, lon: 0 },
            { id: "b4", name: "Campus Grounds", lat: 0, lon: 0 }
        ];

        setBlocks(staticBlocks);
        setLoading(false);
        setError(null);
    }, [college]);

    // Format helper
    const formattedBlocks = blocks.length > 0
        ? blocks.map(b => b.name)
        : ["Loading blocks..."];

    return { blocks, rawBlocks: blocks, formatting: formattedBlocks, loading, error };
}
