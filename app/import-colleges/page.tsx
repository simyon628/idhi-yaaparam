"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";

export default function ImportCollegesPage() {
    const [status, setStatus] = useState("");
    const [isImporting, setIsImporting] = useState(false);

    const loadAndImport = async () => {
        if (!db) return;
        setIsImporting(true);
        setStatus("Fetching CSV from public folder...");

        try {
            const response = await fetch('/colleges.csv');
            if (!response.ok) throw new Error("Could not find colleges.csv in the public folder!");

            setStatus("Parsing CSV...");
            const csvText = await response.text();

            const lines = csvText.split('\n');
            const colleges = [];

            let isFirst = true;
            for (const line of lines) {
                if (!line.trim()) continue;
                if (isFirst) {
                    isFirst = false;
                    continue; // Skip header
                }

                // Split by comma
                const parts = line.split(',');
                // CSV Format: Index, "Name with comma", State, , 

                let name = "";
                let stateField = "";

                if (line.includes('"')) {
                    const firstQuote = line.indexOf('"');
                    const lastQuote = line.lastIndexOf('"');
                    name = line.substring(firstQuote + 1, lastQuote).trim();

                    const remaining = line.substring(lastQuote + 1).split(',');
                    stateField = remaining[1] || remaining[0];
                } else {
                    name = parts[1]?.trim();
                    stateField = parts[2]?.trim();
                }

                if (name) {
                    colleges.push({ name, state: stateField || "" });
                }
            }

            setStatus(`Parsed ${colleges.length} colleges. Uploading to Firestore in batches...`);

            // Firestore batches limit is 500
            const BATCH_SIZE = 400;
            let currentBatch = writeBatch(db);
            let count = 0;
            let batchesCommitted = 0;

            for (const college of colleges) {
                const newDocRef = doc(collection(db, "colleges"));
                currentBatch.set(newDocRef, {
                    name: college.name,
                    state: college.state,
                    city: "", // Default empty city
                    lat: 0,
                    lng: 0,
                    createdAt: new Date().toISOString()
                });
                count++;

                if (count === BATCH_SIZE) {
                    await currentBatch.commit();
                    batchesCommitted++;
                    count = 0;
                    currentBatch = writeBatch(db);
                    setStatus(`Committed batch ${batchesCommitted}...`);
                }
            }

            if (count > 0) {
                await currentBatch.commit();
            }

            setStatus(`✅ Successfully imported ${colleges.length} colleges! You can now use the manual search feature.`);
        } catch (error: any) {
            console.error(error);
            setStatus(`❌ Error: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="p-10 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h1 className="text-3xl font-black mb-4 text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Import Colleges</h1>
            <p className="mb-8 text-slate-500 font-medium max-w-md">
                We've directly attached your `Indian_Engineering_Colleges_Dataset` to the application. Click the button below to parse and seed your database instantly.
            </p>

            <button
                onClick={loadAndImport}
                disabled={isImporting}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-8 py-4 rounded-2xl font-bold disabled:opacity-50 transition-all shadow-indigo"
            >
                {isImporting ? "Importing to Firestore..." : "Seed Colleges to Database"}
            </button>

            {status && (
                <div className="mt-8 p-4 bg-slate-100 rounded-xl font-mono text-sm border border-slate-200 shadow-inner w-full">
                    {status}
                </div>
            )}
        </div>
    );
}
