"use client";

import { useState, useEffect } from "react";
export const dynamic = "force-dynamic";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, ArrowRightLeft, PackageCheck, Loader2 } from "lucide-react";

export default function MyRentalsPage() {
    const [incoming, setIncoming] = useState<any[]>([]);
    const [myBorrows, setMyBorrows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const userId = auth?.currentUser?.uid;

    useEffect(() => {
        if (!userId || !db) return;

        // Listen for Incoming Requests (Items I own)
        const incomingQuery = query(
            collection(db, "rentals"),
            where("ownerId", "==", userId),
            where("status", "in", ["requested", "approved", "overdue"])
        );

        const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setIncoming(items);
            setLoading(false);
        });

        // Listen for My Borrows (Items I'm renting)
        const borrowsQuery = query(
            collection(db, "rentals"),
            where("renterId", "==", userId)
        );

        const unsubscribeBorrows = onSnapshot(borrowsQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyBorrows(items);
        });

        return () => {
            unsubscribeIncoming();
            unsubscribeBorrows();
        };
    }, [userId]);

    const handleAction = async (rentalId: string, status: string) => {
        if (!db) return;
        try {
            const rentalRef = doc(db, "rentals", rentalId);
            if (status === "available") {
                // Rejecting - clear renterId
                await updateDoc(rentalRef, { status, renterId: null });
                toast.info("Request rejected");
            } else {
                await updateDoc(rentalRef, { status });
                toast.success(`Request ${status}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Action failed");
        }
    };

    const handleReport = async (item: any) => {
        if (!item.renterId || !db || !userId) return;

        const confirmReport = window.confirm("Are you sure you want to report this user? This will add 1 strike.");
        if (!confirmReport) return;

        try {
            // 1. Create Report
            await addDoc(collection(db, "reports"), {
                rentalId: item.id,
                renterId: item.renterId,
                ownerId: userId,
                reason: "Item not returned / Damaged",
                timestamp: serverTimestamp(),
            });

            // 2. Fetch Renter User Doc
            const renterRef = doc(db, "users", item.renterId);
            const renterSnap = await getDoc(renterRef);

            if (renterSnap.exists()) {
                const userData = renterSnap.data();
                const currentReports = (userData.reportsCount || 0) + 1;

                // 3. Increment strikes and check for block
                await updateDoc(renterRef, {
                    reportsCount: currentReports,
                    isBlocked: currentReports >= 2
                });

                if (currentReports >= 2) {
                    toast.error("User has been BLOCKED (2 strikes reached).");
                } else {
                    toast.warning("User reported. 1 strike added.");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to file report.");
        }
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 text-indigo-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold font-outfit text-xl">Loading Dashboard...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col bg-slate-50 relative min-h-screen pb-32 overflow-y-auto">
            {/* Ambient Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 blob rounded-full mix-blend-multiply filter blur-3xl animate-float pointer-events-none" style={{ animationDelay: "0s" }} />
            <div className="fixed top-[20%] right-[-10%] w-[40%] h-[60%] bg-pink-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />
            <div className="fixed bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-purple-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float pointer-events-none" style={{ animationDelay: "4s" }} />

            <div className="relative z-10 w-full max-w-md mx-auto">
                <header className="px-6 py-10 sticky top-0 bg-slate-50/80 backdrop-blur-xl z-20 border-b border-indigo-50/50">
                    <h1 className="text-3xl font-black text-slate-800 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Dashboard</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-2">Manage your active rentals.</p>
                </header>

                <Tabs defaultValue="incoming" className="px-5 mt-6">
                    <TabsList className="w-full bg-white/60 backdrop-blur-md border border-indigo-50 p-1.5 h-16 rounded-[2rem] mb-8 shadow-sm">
                        <TabsTrigger value="incoming" className="flex-1 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-500 transition-all">Incoming</TabsTrigger>
                        <TabsTrigger value="borrows" className="flex-1 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-500 transition-all">My Borrows</TabsTrigger>
                    </TabsList>

                    <TabsContent value="incoming" className="space-y-5 outline-none">
                        {incoming.length === 0 ? (
                            <div className="text-center py-20 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-indigo-50 shadow-sm">
                                <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-100/50 shadow-inner">
                                    <ArrowRightLeft className="text-indigo-300 w-10 h-10" />
                                </div>
                                <p className="text-slate-400 font-bold text-lg">No active requests</p>
                            </div>
                        ) : (
                            incoming.map((item) => (
                                <div key={item.id} className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-indigo-50 shadow-sm flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5 group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg text-slate-800">{item.itemName}</h3>
                                            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1">Status: {item.status}</p>
                                        </div>
                                    </div>
                                    {item.status === "requested" ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(item.id, "approved")}
                                                className="gradient-indigo text-white p-3 rounded-2xl shadow-indigo active:scale-95 hover:-translate-y-0.5 transition-all w-12 h-12 flex items-center justify-center"
                                            >
                                                <Check className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={() => handleAction(item.id, "available")}
                                                className="bg-white border border-rose-100 text-rose-500 p-3 rounded-2xl active:scale-95 hover:-translate-y-0.5 hover:bg-rose-50 hover:border-rose-200 transition-all w-12 h-12 flex items-center justify-center shadow-sm"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleReport(item)}
                                                className="text-[11px] font-black text-rose-400/80 uppercase tracking-widest hover:text-rose-500 transition-colors"
                                            >
                                                Report
                                            </button>
                                            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-inner">
                                                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest pt-[1px]">Active</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="borrows" className="space-y-5 outline-none">
                        {myBorrows.length === 0 ? (
                            <div className="text-center py-20 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-indigo-50 shadow-sm">
                                <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-100/50 shadow-inner">
                                    <PackageCheck className="text-indigo-300 w-10 h-10" />
                                </div>
                                <p className="text-slate-400 font-bold text-lg">No active borrows</p>
                            </div>
                        ) : (
                            myBorrows.map((item) => (
                                <div key={item.id} className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-indigo-50 shadow-sm flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5 group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg text-slate-800">{item.itemName}</h3>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.block}</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-inner ${item.status === 'approved' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-slate-100 border border-slate-200 text-slate-500'
                                        }`}>
                                        {item.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <BottomNav />
        </div>
    );
}
