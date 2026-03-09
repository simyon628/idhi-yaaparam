import { useState, useEffect } from "react";
import { College } from "@/lib/types";
import { calculateDistance } from "@/lib/utils";
import { useCampusBlocks, CampusBlock } from "./useCampusBlocks";

interface NearestBlockHookState {
    nearestBlock: CampusBlock | null;
    distanceMeters: number | null;
    isLoading: boolean;
}

export function useNearestBlock(selectedCollege: College | null) {
    const [state, setState] = useState<NearestBlockHookState>({
        nearestBlock: null,
        distanceMeters: null,
        isLoading: false,
    });

    const { blocks, loading: blocksLoading } = useCampusBlocks(selectedCollege);

    useEffect(() => {
        if (!selectedCollege || !navigator.geolocation) {
            setState(s => ({ ...s, nearestBlock: null, distanceMeters: null, isLoading: false }));
            return;
        }

        if (blocksLoading) {
            setState(s => ({ ...s, isLoading: true }));
            return;
        }

        if (blocks.length === 0) {
            setState(s => ({ ...s, nearestBlock: null, distanceMeters: null, isLoading: false }));
            return;
        }

        let isMounted = true;

        const findBlock = async () => {
            try {
                // First get user location
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 60000 // Cache for 1 min
                    });
                });

                const { latitude, longitude } = position.coords;

                let closestBlock: CampusBlock | null = null;
                let minDistance = Infinity;

                blocks.forEach(block => {
                    const distance = calculateDistance(latitude, longitude, block.lat, block.lon);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestBlock = block;
                    }
                });

                if (isMounted) {
                    setState({ nearestBlock: closestBlock, distanceMeters: Math.round(minDistance), isLoading: false });
                }

            } catch (err) {
                console.error("Error finding nearest block", err);
                if (isMounted) setState(s => ({ ...s, isLoading: false }));
            }
        };

        findBlock();

        return () => { isMounted = false; };
    }, [selectedCollege, blocks, blocksLoading]);

    return state;
}
