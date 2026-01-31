"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft, MapPin, Clock, IndianRupee, MessageCircle, ShieldCheck, Loader2 } from "lucide-react";

export default function RentalDetailPage() {
    const { id } = useParams();
    const [rental, setRental] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);

    const router = useRouter();
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        async function fetchRental() {
            if (!id) return;
            try {
                const docRef = doc(db, "rentals", id as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRental({ id: docSnap.id, ...docSnap.data() });
                } else {
                    toast.error("Rental not found");
                    router.push("/home");
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchRental();
    }, [id, router]);

    const handleRequest = async () => {
        if (!userId) {
            toast.error("Please login to request items");
            return;
        }

        setRequesting(true);
        try {
            const rentalRef = doc(db, "rentals", id as string);
            await updateDoc(rentalRef, {
                status: "requested",
                renterId: userId,
                requestedAt: serverTimestamp(),
            });
            toast.success("Request sent to owner!");
            setRental((prev: any) => ({ ...prev, status: "requested", renterId: userId }));
        } catch (error) {
            console.error(error);
            toast.error("Failed to send request");
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const isOwner = rental?.ownerId === userId;
    const isRenter = rental?.renterId === userId;

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 pb-20">
            {/* Header Image */}
            <div className="relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden">
                <img
                    src={rental?.photoUrl || `https://via.placeholder.com/400?text=${rental?.itemName}`}
                    alt={rental?.itemName}
                    className="w-full h-full object-cover"
                />
                <button
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 active:scale-95 transition-all"
                >
                    <ChevronLeft className="w-6 h-6 text-zinc-900" />
                </button>
                <div className="absolute top-6 right-6 px-4 py-2 bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-white/10">
                    <span className="text-white font-black text-sm uppercase tracking-widest">{rental?.status}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-8 pt-8 -mt-8 bg-white dark:bg-zinc-950 rounded-t-[3rem] relative z-10 shadow-2xl shadow-black/20">
                <div className="flex items-start justify-between mb-6">
                    <div className="space-y-1">
                        <span className="text-4xl">{rental?.icon}</span>
                        <h1 className="text-3xl font-black text-zinc-900 leading-tight">{rental?.itemName}</h1>
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-widest">{rental?.block}</span>
                        </div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800 text-center min-w-[100px]">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Per Hour</p>
                        <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <IndianRupee className="w-4 h-4" />
                            <span className="text-2xl font-black">{rental?.pricePerHour}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-3xl space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Trust Score</p>
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="font-black">Verified</span>
                        </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-3xl space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Availability</p>
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="font-black">Until 5 PM</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-xs">Description</h3>
                    <p className="text-zinc-500 leading-relaxed text-sm">
                        Top condition {rental?.itemName} available for immediate use in {rental?.block}.
                        Please return by the promised time to maintain your trust score.
                    </p>
                </div>

                {/* Action Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 glass border-t border-zinc-100 dark:border-zinc-800 max-w-md mx-auto z-50">
                    {isOwner ? (
                        <Button className="w-full h-16 rounded-2xl text-lg font-black bg-zinc-900 text-white" disabled>
                            YOUR LISTING
                        </Button>
                    ) : rental?.status === "available" ? (
                        <Button
                            onClick={handleRequest}
                            disabled={requesting}
                            className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
                        >
                            {requesting ? <Loader2 className="animate-spin" /> : "REQUEST NOW"}
                        </Button>
                    ) : isRenter ? (
                        <div className="flex gap-3">
                            <Button className="flex-1 h-16 rounded-2xl text-lg font-black bg-zinc-100 text-zinc-900 border border-zinc-200">
                                <MessageCircle className="w-5 h-5 mr-2" /> CHAT
                            </Button>
                            <div className="flex-1 flex flex-col items-center justify-center bg-primary/10 rounded-2xl border border-primary/20">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Status</span>
                                <span className="text-xs font-black text-primary uppercase tracking-tight">{rental?.status}</span>
                            </div>
                        </div>
                    ) : (
                        <Button className="w-full h-16 rounded-2xl text-lg font-black bg-zinc-100 text-zinc-400" disabled>
                            REGRETTABLY TAKEN
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
