"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";

export default function ImportCollegesPage() {
    const [csvText, setCsvText] = useState("");
    const [status, setStatus] = useState("");
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async () => {
        if (!csvText || !db) return;
        setIsImporting(true);
        setStatus("Parsing CSV...");

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

        setStatus(`Parsed ${colleges.length} colleges. Uploading...`);

        try {
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

            setStatus(`✅ Successfully imported ${colleges.length} colleges! You can now manually search for them.`);
        } catch (error: any) {
            console.error(error);
            setStatus(`❌ Error: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="p-10 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Import Colleges from CSV</h1>
            <p className="mb-4 text-slate-500">Paste the raw CSV content below to import it into the regular Firestore `colleges` collection.</p>

            <textarea
                className="w-full h-64 border rounded p-4 font-mono text-sm mb-4"
                placeholder="Paste CSV here...,College_Name,State,,"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                disabled={isImporting}
            />

            <button
                onClick={handleImport}
                disabled={isImporting || !csvText}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50"
            >
                {isImporting ? "Importing..." : "Start Import"}
            </button>

            {status && (
                <div className="mt-6 p-4 bg-slate-100 rounded-xl font-mono text-sm">
                    {status}
                </div>
            )}
        </div>
    );
}
