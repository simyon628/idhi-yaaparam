"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth, storage } from "@/lib/firebase";
import { doc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { ChevronLeft, Send, Loader2, Info, Image as ImageIcon, QrCode, Camera } from "lucide-react";
import { Listing } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

interface Message {
    id: string;
    text?: string;
    imageUrl?: string;
    senderId: string;
    createdAt: any;
    type?: "text" | "image" | "system";
}

export default function ChatPage() {
    const { id } = useParams();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [rental, setRental] = useState<Listing | null>(null);
    const [otherUser, setOtherUser] = useState<{ name: string, department: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgUploading, setImgUploading] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const userId = auth?.currentUser?.uid;

    // Load Rental & Verify Access
    useEffect(() => {
        if (!id || !userId || !db) return;
        const unsub = onSnapshot(doc(db as any, "rentals", id as string), async (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Listing;
                if (data.ownerId !== userId && data.renterId !== userId) {
                    toast.error("Unauthorized to view this transaction.");
                    router.push("/rentals");
                    return;
                }
                setRental(data);
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

    // Load messages
    useEffect(() => {
        if (!id || !db) return;
        const q = query(
            collection(db as any, `rentals/${id}/messages`),
            orderBy("createdAt", "asc")
        );
        const unsub = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
            setMessages(msgs);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsub();
    }, [id]);

    const sendMessage = async (e?: React.FormEvent, directText?: string) => {
        if (e) e.preventDefault();
        const text = (directText || newMessage).trim();
        if (!text || !userId || !db || !id) return;
        if (!directText) setNewMessage("");
        await addDoc(collection(db as any, `rentals/${id}/messages`), {
            text,
            senderId: userId,
            createdAt: serverTimestamp(),
            type: "text",
            isRead: false
        });
        
        if (rental) {
            const targetUserId = rental.ownerId === userId ? rental.renterId : rental.ownerId;
            fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetUserId,
                    title: `New message for ${rental.itemName}`,
                    body: text,
                    link: `/chat/${id}`
                })
            }).catch(console.error);
        }
        
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleImageUpload = async (file: File) => {
        if (!file || !userId || !db || !id || !storage) return;
        setImgUploading(true);
        try {
            const storageRef = ref(storage, `chat/${id}/${Date.now()}_${file.name}`);
            const snap = await new Promise<string>((resolve, reject) => {
                const task = uploadBytesResumable(storageRef, file);
                task.on("state_changed", null, reject, async () => {
                    resolve(await getDownloadURL(task.snapshot.ref));
                });
            });
            await addDoc(collection(db as any, `rentals/${id}/messages`), {
                imageUrl: snap,
                senderId: userId,
                createdAt: serverTimestamp(),
                type: "image",
            });
            
            if (rental) {
                const targetUserId = rental.ownerId === userId ? rental.renterId : rental.ownerId;
                fetch("/api/notifications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        targetUserId,
                        title: `New message for ${rental.itemName}`,
                        body: "📷 Sent an image",
                        link: `/chat/${id}`
                    })
                }).catch(console.error);
            }
        } catch {
            toast.error("Image upload failed");
        } finally {
            setImgUploading(false);
        }
    };

    const handleCheckIn = async () => {
        if (checkedIn || !rental || !db || !userId) return;

        // Optimistically set checked in state
        setCheckedIn(true);
        await sendMessage(undefined, `✅ ${userId === rental.ownerId ? "Owner" : "Renter"} confirmed the meetup & handoff!`);
        toast.success("Check-in confirmed! Waiting for other person.");

        try {
            // Get current checkIns from db to avoid race conditions
            const docRef = doc(db as any, "rentals", id as string);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return;

            const data = docSnap.data();
            const currentCheckIns: string[] = data.checkIns || [];
            if (!currentCheckIns.includes(userId)) {
                currentCheckIns.push(userId);
            }

            const updates: any = { checkIns: currentCheckIns };
            if (currentCheckIns.length >= 2) {
                updates.status = "completed";
                updates.completedAt = serverTimestamp();
            }

            await updateDoc(docRef, updates);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
    );

    const isCompleted = rental?.status === "completed" || rental?.status === "cancelled";
    const qrPayload = JSON.stringify({ rentalId: id, verify: "handover", ts: Date.now() });
    const QUICK_ACTIONS = ["I'm at the location! 📍", "On my way! 🏃", "Found you! 👋", "Can't find you 😕"];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-2xl border-b border-indigo-100 px-5 pt-11 pb-3 shadow-sm mx-auto max-w-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 bg-slate-50 border border-slate-200 rounded-xl active:scale-90 transition-all text-slate-500">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-sm font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                            {otherUser?.name || "Loading..."}
                        </h1>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{rental?.itemName}</p>
                    </div>
                    {/* QR Code Toggle */}
                    {rental?.status === "active" && (
                        <button
                            onClick={() => setShowQR(!showQR)}
                            className={`p-2 rounded-xl border transition-all ${showQR ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                        >
                            <QrCode className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* QR Panel */}
            <AnimatePresence>
                {showQR && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        className="fixed top-[100px] left-0 right-0 z-30 px-5 mx-auto max-w-md"
                    >
                        <div className="bg-white/95 backdrop-blur-md border border-indigo-100 rounded-3xl p-6 shadow-premium text-center">
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                                {userId === rental?.ownerId ? "Show this to the Renter ↓" : "Scan Owner's QR to confirm handover"}
                            </div>
                            <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm inline-block">
                                <QRCodeSVG
                                    value={qrPayload}
                                    size={180}
                                    bgColor="#ffffff"
                                    fgColor="#4338ca"
                                    level="M"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-3">Valid for this transaction only</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <main className="flex-1 pt-[105px] pb-[110px] px-4 flex flex-col gap-2">
                {/* Safety Notice */}
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl flex items-start gap-2.5 mb-2 shadow-sm">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold text-indigo-700 leading-relaxed">
                        Coordinate your meetup safely on campus. Never share OTPs or payment links.
                    </p>
                </div>

                {/* Check-in Banner */}
                {rental?.status === "active" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl p-3 mb-2"
                    >
                        <span className="text-xs font-bold text-emerald-700">
                            {checkedIn ? "✅ Meetup confirmed!" : "Met in person? Check in."}
                        </span>
                        {!checkedIn && (
                            <button onClick={handleCheckIn} className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase tracking-wider active:scale-95 transition-all shadow-sm">
                                Check In
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Messages */}
                <div className="flex flex-col gap-2">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => {
                            const isMe = msg.senderId === userId;
                            const isSystem = msg.type === "system" || msg.text?.startsWith("✅");
                            if (isSystem) return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex justify-center"
                                >
                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-200">
                                        {msg.text}
                                    </span>
                                </motion.div>
                            );
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.imageUrl ? (
                                        <div className={`max-w-[70%] overflow-hidden rounded-2xl border-2 shadow-sm ${isMe ? "border-indigo-200 rounded-tr-sm" : "border-slate-200 rounded-tl-sm"}`}>
                                            <img src={msg.imageUrl} alt="shared" className="w-full h-auto object-cover max-h-48" />
                                        </div>
                                    ) : (
                                        <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm ${isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"}`}>
                                            {msg.text}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
                <div ref={bottomRef} className="h-4" />
            </main>

            {/* Input Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-indigo-50 p-3 pb-safe z-40 shadow-[0_-10px_40px_-10px_rgba(110,115,200,0.15)] mx-auto max-w-md">
                {isCompleted ? (
                    <div className="h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transaction Ended</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {/* Quick replies */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                            {QUICK_ACTIONS.map(action => (
                                <button
                                    key={action}
                                    onClick={() => sendMessage(undefined, action)}
                                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[11px] font-bold transition-colors border border-slate-200 active:scale-95"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                        {/* Input row */}
                        <div className="flex gap-2 items-center">
                            {/* Image Upload Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={imgUploading}
                                className="w-11 h-11 flex-shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all active:scale-90 disabled:opacity-50"
                            >
                                {imgUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                            />

                            <form onSubmit={sendMessage} className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Message..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 h-11 text-sm font-semibold outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner placeholder-slate-400"
                                />
                                <motion.button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    whileTap={{ scale: 0.85 }}
                                    className="w-11 h-11 rounded-2xl gradient-indigo text-white flex items-center justify-center shadow-indigo disabled:opacity-50 transition-opacity"
                                >
                                    <Send className="w-4 h-4" />
                                </motion.button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
