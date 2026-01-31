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
    const userId = auth.currentUser?.uid;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatId || !userId) return;

        // Fetch chat info
        const fetchChat = async () => {
            const chatSnap = await getDoc(doc(db, "chats", chatId as string));
            if (chatSnap.exists()) {
                setChatInfo(chatSnap.data());
            }
        };
        fetchChat();

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
        if (!newMessage.trim() || !userId || !chatId) return;

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

    if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex-1 flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <header className="glass border-b border-zinc-100 px-6 py-4 flex items-center gap-4 max-w-md mx-auto w-full z-50">
                <button onClick={() => router.back()} className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100">
                    <ChevronLeft className="w-5 h-5 text-zinc-900" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                        <h2 className="font-black text-sm text-zinc-900 leading-none">Chat with Owner</h2>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Online</p>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar pb-32">
                {messages.map((msg) => {
                    const isMe = msg.senderId === userId;
                    return (
                        <div key={msg.id} className={cn(
                            "flex flex-col max-w-[80%] gap-1",
                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                        )}>
                            <div className={cn(
                                "px-5 py-3 rounded-3xl text-sm font-medium shadow-sm",
                                isMe ? "bg-zinc-900 text-white rounded-tr-none" : "bg-white text-zinc-900 border border-zinc-100 rounded-tl-none"
                            )}>
                                {msg.text}
                            </div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                {msg.timestamp?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="fixed bottom-0 left-0 right-0 p-6 glass border-t border-zinc-100 max-w-md mx-auto z-50 rounded-t-[2.5rem]">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 h-14 bg-white border-zinc-100 rounded-2xl px-6 text-sm font-medium shadow-sm focus:ring-primary"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="w-14 h-14 rounded-2xl shadow-xl shadow-primary/20 flex-shrink-0"
                        disabled={!newMessage.trim() || loading}
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
