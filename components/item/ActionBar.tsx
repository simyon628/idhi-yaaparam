"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Bookmark, MessageSquare, Heart, Loader2, X } from "lucide-react";
import { Listing } from "@/lib/types";

interface ActionBarProps {
    item: Listing;
    isOwner: boolean;
    currentUserId: string | null;
    isSaved: boolean;
    onToggleSave: () => void;
    onMarkSold: () => void;
    ownerActionLoading?: boolean;
}

// Bottom sheet for message before sending request
function BorrowMessageSheet({
    onClose,
    onSend,
    loading,
}: { onClose: () => void; onSend: (msg: string) => void; loading: boolean }) {
    const [msg, setMsg] = useState("");
    return (
        <div className="fixed inset-0 z-[101] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full bg-white rounded-t-3xl p-6 z-10 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-800 text-base">Add a message <span className="text-slate-400 font-medium">(optional)</span></h3>
                    <button onClick={onClose} className="p-2 rounded-full bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
                </div>
                <textarea
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    placeholder="Hi! I need this for my practicals…"
                    className="w-full h-28 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 resize-none"
                />
                <button
                    onClick={() => onSend(msg)}
                    disabled={loading}
                    className="mt-3 w-full h-12 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-60"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
                </button>
            </div>
        </div>
    );
}

export function ActionBar({ item, isOwner, currentUserId, isSaved, onToggleSave, onMarkSold, ownerActionLoading }: ActionBarProps) {
    const router = useRouter();
    const [showSheet, setShowSheet] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [sendingRequest, setSendingRequest] = useState(false);

    const isAvailable = item.status === "available";
    const isRent = !item.listingType || item.listingType === "rent";
    const isSell = item.listingType === "sell";
    const isFree = (item as any).listingType === "free";

    const handleBorrowSend = async (msg: string) => {
        if (!currentUserId) { router.push(`/login?redirect=/item/${item.id}`); return; }
        setSendingRequest(true);
        try {
            await addDoc(collection(db!, "borrow_requests"), {
                item_id: item.id,
                requester_id: currentUserId,
                owner_id: item.ownerId,
                status: "pending",
                message: msg,
                created_at: serverTimestamp(),
            });
            toast.success("Request sent! Wait for owner to confirm. 🎉");
            setRequestSent(true);
            setShowSheet(false);
        } catch (err) {
            toast.error("Could not send request. Please try again.");
        } finally {
            setSendingRequest(false);
        }
    };

    const handleMessageSeller = async () => {
        if (!currentUserId) { router.push(`/login?redirect=/item/${item.id}`); return; }
        // Navigate to the chat page for this item
        router.push(`/chat/${item.id}`);
    };

    // CASE B: Owner view
    if (isOwner) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-4 py-3 flex gap-3">
                <button
                    onClick={() => router.push(`/rentals/edit/${item.id}`)}
                    className="flex-1 h-12 rounded-2xl border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={onMarkSold}
                    disabled={ownerActionLoading}
                    className="flex-1 h-12 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                    {ownerActionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Mark Sold"}
                </button>
            </div>
        );
    }

    // CASE C: Not available
    if (!isAvailable) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-4 py-3">
                <button disabled className="w-full h-12 rounded-2xl bg-slate-100 text-slate-400 text-sm font-black uppercase tracking-widest cursor-not-allowed">
                    Not Available Right Now
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-1.5 font-medium">Save to get notified when available</p>
            </div>
        );
    }

    // CASE D: Not logged in
    if (!currentUserId) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-4 py-3">
                <button
                    onClick={() => router.push(`/login?redirect=/item/${item.id}`)}
                    className="w-full h-12 rounded-2xl bg-indigo-600 text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-md active:scale-95"
                >
                    Login to Contact Seller →
                </button>
            </div>
        );
    }

    // CASE A: Available, logged in, not owner
    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-4 py-3 flex gap-3">

                {/* Save button */}
                <button
                    onClick={onToggleSave}
                    className={`h-12 w-12 rounded-2xl border flex items-center justify-center transition-all shrink-0 ${isSaved ? "bg-rose-50 border-rose-200 text-rose-500" : "border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-400"}`}
                >
                    <Heart className={`w-5 h-5 ${isSaved ? "fill-rose-500" : ""}`} />
                </button>

                {/* Primary action */}
                {isFree ? (
                    <button
                        onClick={handleMessageSeller}
                        className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-md active:scale-95"
                    >
                        Message to Claim →
                    </button>
                ) : isRent ? (
                    requestSent ? (
                        <button disabled className="flex-1 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-sm uppercase tracking-widest">
                            Request Sent ✓
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (!currentUserId) { router.push(`/login?redirect=/item/${item.id}`); return; }
                                setShowSheet(true);
                            }}
                            className="flex-1 h-12 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-md active:scale-95"
                        >
                            Request to Borrow →
                        </button>
                    )
                ) : (
                    <button
                        onClick={handleMessageSeller}
                        className="flex-1 h-12 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Message Seller →
                    </button>
                )}
            </div>

            {showSheet && (
                <BorrowMessageSheet
                    onClose={() => setShowSheet(false)}
                    onSend={handleBorrowSend}
                    loading={sendingRequest}
                />
            )}
        </>
    );
}
