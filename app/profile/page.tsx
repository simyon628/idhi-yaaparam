"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import {
    LogOut, ShieldCheck, AlertTriangle, User, Package, Clock, IndianRupee, MapPin,
    ChevronRight, Loader2, Navigation, Star
} from "lucide-react";
import { Listing } from "@/lib/types";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCollege } from "@/contexts/CollegeContext";

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<"listings" | "borrowing">("listings");
    const [userProfile, setUserProfile] = useState<any>(null);
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [myBorrowing, setMyBorrowing] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const { selectedCollege } = useCollege();
    const userId = auth?.currentUser?.uid;

    useEffect(() => {
        if (!userId || !db) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch User
                const userSnap = await getDoc(doc(db as any, "users", userId));
                if (userSnap.exists()) setUserProfile(userSnap.data());

                // Fetch My Listings (Owner)
                const listingsQ = query(
                    collection(db as any, "rentals"),
                    where("ownerId", "==", userId),
                    orderBy("createdAt", "desc")
                );
                const lSnap = await getDocs(listingsQ);
                setMyListings(lSnap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));

                // Fetch My Borrowing (Renter)
                const borrowQ = query(
                    collection(db as any, "rentals"),
                    where("renterId", "==", userId)
                );
                const bSnap = await getDocs(borrowQ);
                setMyBorrowing(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));

            } catch (err) {
                console.error("Error fetching profile data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const handleLogout = async () => {
        try {
            await signOut(auth as any);
            // Clear persistent physical location cache on physical logout
            localStorage.removeItem("iy_cached_physical_location");
            toast.success("Logged out successfully");
            router.push("/");
        } catch {
            toast.error("Failed to log out");
        }
    };

    if (!userId && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 px-5 text-center">
                <User className="w-16 h-16 text-indigo-300 mb-4" />
                <h2 className="text-xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>You are not logged in</h2>
                <p className="text-sm font-semibold text-slate-500 mt-2 mb-8">Sign in to view your campus profile</p>
                <button onClick={() => router.push("/login")} className="h-14 px-8 rounded-2xl gradient-indigo text-white font-black shadow-indigo active:scale-95 transition-all">Sign In Now</button>
            </div>
        );
    }

    if (loading) {
        return <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;
    }

    const activeData = activeTab === "listings" ? myListings : myBorrowing;
    const strikes = userProfile?.strikeCount || 0;

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-24">
            <TopBar />

            <main className="flex-1 px-5 pt-6 space-y-6">
                {/* Profile Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-indigo-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full gradient-indigo flex items-center justify-center text-white font-black text-2xl shadow-indigo shrink-0">
                            {userProfile?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 leading-tight mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                                {userProfile?.name || "Student"}
                            </h1>
                            <div className="flex items-center gap-1.5 opacity-80 mt-1">
                                <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md uppercase tracking-widest">{userProfile?.department || "N/A"}</span>
                                {userProfile?.reviewCount && userProfile?.reviewCount > 0 ? (
                                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md">
                                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                                        {userProfile.overallRating?.toFixed(1)} <span className="text-amber-600/60 font-medium tracking-widest uppercase ml-0.5">({userProfile.reviewCount} Reviews)</span>
                                    </div>
                                ) : (
                                    <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-widest">No Reviews Yet</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Governance Status */}
                    <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Campus Safety</p>
                            {strikes === 0 ? (
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-sm font-black">Excellent Standing</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-rose-500">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-black text-rose-600">Warning ({strikes}/2 Strikes)</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-3 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-100 active:scale-95 transition-all shadow-sm"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Quick Links */}
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => router.push("/profile/history")}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-sm transition-colors shadow-sm"
                        >
                            <Clock className="w-4 h-4" /> Transaction History
                        </button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-200/50 p-1.5 rounded-2xl relative shadow-inner">
                    <button
                        onClick={() => setActiveTab("listings")}
                        className={`flex-1 py-3 text-sm font-black rounded-xl transition-all z-10 ${activeTab === "listings" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        My Listings
                    </button>
                    <button
                        onClick={() => setActiveTab("borrowing")}
                        className={`flex-1 py-3 text-sm font-black rounded-xl transition-all z-10 ${activeTab === "borrowing" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Renting
                    </button>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {activeData.length === 0 ? (
                        <div className="text-center py-10">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-semibold text-sm">Nothing to show right now.</p>
                        </div>
                    ) : (
                        activeData.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => router.push(`/rentals/${item.id}`)}
                                className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex gap-4"
                            >
                                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                                    <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-[15px] font-black text-slate-800 leading-tight mb-0.5">{item.itemName}</h3>
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <MapPin className="w-3 h-3" />
                                                <span className="text-[11px] font-bold uppercase tracking-widest">{item.block}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 text-indigo-600 font-black">
                                            <IndianRupee className="w-3.5 h-3.5" />
                                            <span>{item.pricePerHour}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md ${item.status === "available" ? "bg-emerald-50 text-emerald-600" :
                                            item.status === "active" ? "bg-indigo-50 text-indigo-600" :
                                                item.status === "requested" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                                            }`}>
                                            {item.status}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
