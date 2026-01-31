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
        if (!item.renterId) return;

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

    if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 pb-32">
            <header className="px-8 py-8">
                <h1 className="text-3xl font-black text-zinc-900 leading-none">Dashboard</h1>
                <p className="text-zinc-500 mt-2 font-medium">Manage your active rentals.</p>
            </header>

            <Tabs defaultValue="incoming" className="px-6">
                <TabsList className="w-full bg-white border border-zinc-100 p-1 h-14 rounded-2xl mb-8">
                    <TabsTrigger value="incoming" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest">Incoming</TabsTrigger>
                    <TabsTrigger value="borrows" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest">My Borrows</TabsTrigger>
                </TabsList>

                <TabsContent value="incoming" className="space-y-4">
                    {incoming.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-zinc-100">
                            <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ArrowRightLeft className="text-zinc-300 w-8 h-8" />
                            </div>
                            <p className="text-zinc-400 font-bold">No active requests</p>
                        </div>
                    ) : (
                        incoming.map((item) => (
                            <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{item.icon}</span>
                                    <div>
                                        <h3 className="font-black text-sm">{item.itemName}</h3>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Status: {item.status}</p>
                                    </div>
                                </div>
                                {item.status === "requested" ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(item.id, "approved")}
                                            className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(item.id, "available")}
                                            className="bg-zinc-100 text-zinc-500 p-2.5 rounded-xl active:scale-95 transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleReport(item)}
                                            className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600"
                                        >
                                            Report
                                        </button>
                                        <div className="bg-zinc-50 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-zinc-400" />
                                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tight">Active</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="borrows" className="space-y-4">
                    {myBorrows.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">{item.icon}</span>
                                <div>
                                    <h3 className="font-black text-sm">{item.itemName}</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.block}</p>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                                }`}>
                                {item.status}
                            </div>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>

            <BottomNav />
        </div>
    );
}
