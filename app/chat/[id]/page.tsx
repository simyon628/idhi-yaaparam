"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    getDoc
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
    const { id: chatId } = useParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatInfo, setChatInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const userId = auth?.currentUser?.uid;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatId || !userId) return;

        // Fetch chat info
        const fetchChat = async () => {
            if (!db) return;
            const chatSnap = await getDoc(doc(db, "chats", chatId as string));
            if (chatSnap.exists()) {
                setChatInfo(chatSnap.data());
            }
        };
        fetchChat();

        if (!db) return;
        // Listen for messages
        const q = query(
            collection(db, "chats", chatId as string, "messages"),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            setLoading(false);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [chatId, userId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId || !chatId || !db) return;

        const messageContent = newMessage.trim();
        setNewMessage("");

        try {
            await addDoc(collection(db, "chats", chatId as string, "messages"), {
                senderId: userId,
                text: messageContent,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 text-indigo-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold font-outfit text-xl">Loading Chat...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-screen bg-slate-50 relative overflow-hidden">
            {/* Ambient Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 blob rounded-full mix-blend-multiply filter blur-3xl animate-float pointer-events-none" style={{ animationDelay: "0s" }} />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-pink-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

            {/* Header */}
            <header className="bg-white/60 backdrop-blur-xl border-b border-indigo-50/50 px-6 py-4 flex items-center gap-4 max-w-md mx-auto w-full z-50 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
                <button onClick={() => router.back()} className="p-2.5 bg-white rounded-xl shadow-sm border border-indigo-50 active:scale-95 transition-transform">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100/50 rounded-full flex items-center justify-center shadow-inner">
                        <User className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="font-black text-[15px] text-slate-800 leading-none pb-0.5">Chat with Owner</h2>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 no-scrollbar pb-32 relative z-10 max-w-md mx-auto w-full">
                {messages.map((msg) => {
                    const isMe = msg.senderId === userId;
                    return (
                        <div key={msg.id} className={cn(
                            "flex flex-col max-w-[85%] gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                        )}>
                            <div className={cn(
                                "px-5 py-3.5 rounded-3xl text-[15px] font-semibold shadow-sm",
                                isMe
                                    ? "gradient-indigo text-white rounded-br-sm shadow-indigo"
                                    : "bg-white/80 backdrop-blur-md text-slate-700 border border-indigo-50 rounded-bl-sm"
                            )}>
                                {msg.text}
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-1",
                                isMe ? "text-indigo-400" : "text-slate-400"
                            )}>
                                {msg.timestamp?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/60 backdrop-blur-xl border-t border-indigo-50/50 max-w-md mx-auto z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 h-14 bg-white/80 backdrop-blur-md border border-indigo-50 rounded-2xl px-5 text-[15px] font-semibold text-slate-700 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || loading}
                        className="w-14 h-14 rounded-2xl gradient-indigo text-white shadow-indigo flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:scale-100 active:scale-95 hover:-translate-y-0.5 transition-all"
                    >
                        <Send className="w-5 h-5 ml-[-2px] mt-[2px]" />
                    </button>
                </form>
            </div>
        </div>
    );
}
