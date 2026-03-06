import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Block, College } from "@/lib/types";
import { calculateDistance } from "@/lib/utils";

interface NearestBlockHookState {
    nearestBlock: Block | null;
    distanceMeters: number | null;
    isLoading: boolean;
}

export function useNearestBlock(selectedCollege: College | null) {
    const [state, setState] = useState<NearestBlockHookState>({
        nearestBlock: null,
        distanceMeters: null,
        isLoading: false,
    });

    useEffect(() => {
        if (!selectedCollege || !navigator.geolocation) {
            setState(s => ({ ...s, nearestBlock: null, distanceMeters: null }));
            return;
        }

        let isMounted = true;

        const findBlock = async () => {
            setState(s => ({ ...s, isLoading: true }));
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

                if (!db) throw new Error("Firestore not initialized");

                // Get blocks for this college
                const blocksRef = collection(db, "blocks");
                const q = query(blocksRef, where("collegeId", "==", selectedCollege.id));
                const snapshot = await getDocs(q);

                const blocks: Block[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Block));

                if (blocks.length === 0) {
                    if (isMounted) setState({ nearestBlock: null, distanceMeters: null, isLoading: false });
                    return;
                }

                let closestBlock: Block | null = null;
                let minDistance = Infinity;

                blocks.forEach(block => {
                    const distance = calculateDistance(latitude, longitude, block.lat, block.lng);
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
    }, [selectedCollege]);

    return state;
}
