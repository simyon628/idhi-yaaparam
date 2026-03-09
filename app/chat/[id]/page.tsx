"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { ChevronLeft, Send, Loader2, Info } from "lucide-react";
import { Listing } from "@/lib/types";

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: any;
}

export default function ChatPage() {
    const { id } = useParams();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [rental, setRental] = useState<Listing | null>(null);
    const [otherUser, setOtherUser] = useState<{ name: string, department: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const bottomRef = useRef<HTMLDivElement>(null);
    const userId = auth?.currentUser?.uid;

    // 1. Load Rental & Verify Access
    useEffect(() => {
        if (!id || !userId || !db) return;

        const unsub = onSnapshot(doc(db as any, "rentals", id as string), async (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Listing;

                // Security gate: Only owner or assigned renter can access chat
                if (data.ownerId !== userId && data.renterId !== userId) {
                    toast.error("Unauthorized to view this transaction.");
                    router.push("/rentals");
                    return;
                }

                setRental(data);

                // Fetch the *other* person's details for the header
                const targetUserId = data.ownerId === userId ? data.renterId : data.ownerId;
                if (targetUserId) {
                    const userSnap = await getDoc(doc(db as any, "users", targetUserId));
                    if (userSnap.exists()) setOtherUser(userSnap.data() as any);
                }
            } else {
                router.push("/rentals");
            }
            setLoading(false);
        });
        return () => unsub();
    }, [id, userId, router]);

    // 2. Load Messages subcollection
    useEffect(() => {
        if (!id || !db) return;
        const q = query(
            collection(db as any, `rentals/${id}/messages`),
            orderBy("createdAt", "asc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach(doc => {
                msgs.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(msgs);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsub();
    }, [id]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId || !db || !id) return;

        const text = newMessage;
        setNewMessage(""); // Optimistic clear

        try {
            await addDoc(collection(db as any, `rentals/${id}/messages`), {
                text,
                senderId: userId,
                createdAt: serverTimestamp()
            });
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch (err) {
            toast.error("Failed to send message.");
        }
    };

    if (loading) {
        return <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;
    }

    const isCompleted = rental?.status === "completed" || rental?.status === "cancelled";

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative">
            <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-indigo-100 px-5 pt-12 pb-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 bg-slate-50 border border-slate-200 rounded-xl active:scale-95 transition-all text-slate-500">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-sm font-black text-slate-800 flex items-center gap-1.5" style={{ fontFamily: "Outfit, sans-serif" }}>
                            {otherUser?.name || "Loading..."}
                        </h1>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{rental?.itemName}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-[100px] pb-[90px] px-5 flex flex-col gap-3">

                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3 mb-4 shadow-sm">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-indigo-800 leading-relaxed">
                        Coordinate the meetup on campus. Never pay via unverified external links. Stay within {rental?.college}.
                    </p>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.senderId === userId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] font-medium shadow-sm ${isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </main>

            {/* Message Input Bar */}
            <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-indigo-50 p-4 pb-safe z-40 shadow-[0_-10px_40px_-10px_rgba(110,115,200,0.15)]">
                {isCompleted ? (
                    <div className="h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction Ended</span>
                    </div>
                ) : (
                    <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Message..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 h-12 text-sm font-semibold outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner placeholder-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-12 h-12 rounded-2xl gradient-indigo text-white flex items-center justify-center shadow-md disabled:opacity-50 active:scale-95 transition-all"
                        >
                            <Send className="w-5 h-5 -ml-0.5 z-10" />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
