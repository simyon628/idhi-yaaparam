"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ImportCollegesPage() {
    const [status, setStatus] = useState<"idle" | "importing" | "success" | "error">("idle");
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [errorMessage, setErrorMessage] = useState("");

    const handleImport = async () => {
        try {
            setStatus("importing");
            setErrorMessage("");
            setProgress({ current: 0, total: 0 });

            console.log("Fetching local CSV...");
            const response = await fetch('/colleges.csv');
            if (!response.ok) throw new Error("Could not find /colleges.csv");

            const csvText = await response.text();
            const lines = csvText.split('\n');

            // Parse CSV manually (using same logic from local utils)
            const collegesData: { name: string; state: string }[] = [];
            let isFirst = true;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;
                if (isFirst) {
                    isFirst = false;
                    continue; // Skip header
                }

                const parts = line.split(',');
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
                    collegesData.push({ name, state: stateField || "" });
                }
            }

            setProgress({ current: 0, total: collegesData.length });
            console.log(`Parsed ${collegesData.length} colleges. Starting Firestore batches...`);

            // Firestore Batching (Max 500 writes per batch)
            const BATCH_SIZE = 450;
            const chunks = [];
            for (let i = 0; i < collegesData.length; i += BATCH_SIZE) {
                chunks.push(collegesData.slice(i, i + BATCH_SIZE));
            }

            if (!db) throw new Error("Firebase is not initialized");

            let importedCount = 0;
            const collegesRef = collection(db, "colleges");

            for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
                const chunk = chunks[chunkIndex];
                const batch = writeBatch(db);

                for (const col of chunk) {
                    const newDocRef = doc(collegesRef);
                    batch.set(newDocRef, {
                        id: newDocRef.id,
                        name: col.name,
                        state: col.state,
                        city: "",
                        lat: 0,
                        lng: 0,
                        createdAt: new Date().toISOString()
                    });
                }

                await batch.commit();
                importedCount += chunk.length;
                setProgress({ current: importedCount, total: collegesData.length });
                console.log(`Batch ${chunkIndex + 1}/${chunks.length} committed. Total: ${importedCount}`);
            }

            setStatus("success");
        } catch (error: any) {
            console.error("Import failed:", error);
            setStatus("error");
            setErrorMessage(error.message || "An unknown error occurred during import.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col items-center text-center">
                <h1 className="text-3xl font-black text-slate-800 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Import Colleges
                </h1>
                <p className="text-slate-500 font-medium mb-8">
                    Seed the Firestore `colleges` collection from the local CSV file.
                </p>

                {status === "idle" && (
                    <button
                        onClick={handleImport}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-4 rounded-xl shadow-indigo transition-all"
                    >
                        Seed Colleges to Database
                    </button>
                )}

                {status === "importing" && (
                    <div className="flex flex-col items-center bg-indigo-50 w-full p-6 rounded-2xl border border-indigo-100">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                        <h3 className="font-bold text-indigo-900">Import started...</h3>
                        <p className="text-sm font-semibold text-indigo-600 mt-2">
                            Processed {progress.current} of {progress.total}
                        </p>
                        {/* Progress Bar */}
                        <div className="w-full bg-indigo-200 h-2 rounded-full mt-4 overflow-hidden">
                            <div
                                className="bg-indigo-600 h-full transition-all duration-300"
                                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center bg-green-50 w-full p-6 rounded-2xl border border-green-100">
                        <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                        <h3 className="font-bold text-green-900 text-lg">Import Successful!</h3>
                        <p className="text-sm font-semibold text-green-700 mt-1">
                            {progress.total} colleges added to Firestore.
                        </p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-6 font-bold text-green-700 hover:text-green-800 underline"
                        >
                            Return to Home
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center bg-rose-50 w-full p-6 rounded-2xl border border-rose-100 mt-4">
                        <AlertCircle className="w-8 h-8 text-rose-500 mb-3" />
                        <h3 className="font-bold text-rose-900">Import Failed</h3>
                        <p className="text-sm font-medium text-rose-700 mt-2 text-center">
                            {errorMessage}
                        </p>
                        <button
                            onClick={() => setStatus("idle")}
                            className="mt-6 w-full py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
