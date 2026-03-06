"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const INITIAL_COLLEGES = [
    {
        name: "SRK Institute of Technology",
        city: "Vijayawada",
        state: "AP",
        lat: 16.486, // approximate
        lng: 80.648,
        radiusMeters: 500,
    },
    {
        name: "VR Siddhartha Engineering College",
        city: "Vijayawada",
        state: "AP",
        lat: 16.488,
        lng: 80.645,
        radiusMeters: 500,
    }
];

const INITIAL_BLOCKS = [
    { name: "CSE Block", lat: 16.4862, lng: 80.6481 },
    { name: "ECE Block", lat: 16.4865, lng: 80.6485 },
    { name: "First Year Block", lat: 16.4858, lng: 80.6480 },
];

export default function SeedPage() {
    const [status, setStatus] = useState("Idle");
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        if (!db) {
            setStatus("Firestore not initialized.");
            return;
        }
        setLoading(true);
        setStatus("Seeding colleges...");

        try {
            // Seed first college
            const col1Ref = await addDoc(collection(db, "colleges"), INITIAL_COLLEGES[0]);
            setStatus(`Added ${INITIAL_COLLEGES[0].name} with ID: ${col1Ref.id}`);

            // Seed second college
            const col2Ref = await addDoc(collection(db, "colleges"), INITIAL_COLLEGES[1]);
            setStatus(`Added ${INITIAL_COLLEGES[1].name} with ID: ${col2Ref.id}`);

            setStatus("Seeding blocks for SRKIT...");
            // Seed blocks for first college
            for (const block of INITIAL_BLOCKS) {
                await addDoc(collection(db, "blocks"), {
                    ...block,
                    collegeId: col1Ref.id
                });
            }

            setStatus("Seeding completed successfully! You can now test location detection.");
        } catch (error: any) {
            console.error("Seeding error:", error);
            setStatus(`Error: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center font-sans max-w-md mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border w-full text-center">
                <h1 className="text-xl font-bold mb-2">Database Seeder</h1>
                <p className="text-sm text-slate-500 mb-6">Seeds initial colleges and blocks data to Firestore.</p>

                <button
                    onClick={handleSeed}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
                >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading ? "Seeding..." : "Seed Data Now"}
                </button>

                <div className="mt-4 p-3 bg-slate-100 rounded-lg text-left text-xs text-slate-700 font-mono break-words min-h-[60px]">
                    Status: {status}
                </div>
            </div>
        </div>
    );
}
