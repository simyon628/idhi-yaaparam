"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import {
    LogOut, ShieldCheck, AlertTriangle, User, Package, Clock,
    IndianRupee, MapPin, ChevronRight, Loader2, Star,
    BarChart2, TrendingUp, Eye, PenTool, Settings, X
} from "lucide-react";
import { Listing } from "@/lib/types";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCollege } from "@/contexts/CollegeContext";
import { useAppMode } from "@/contexts/AppModeContext";
import { theme } from "@/lib/theme.config";

type Tab = "overview" | "my-items" | "stats";

export default function ProfileContent() {
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [listFilter, setListFilter] = useState<string>("all");
    const [userProfile, setUserProfile] = useState<any>(null);
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [myBorrowing, setMyBorrowing] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const { selectedCollege } = useCollege();
    const { mode, setMode } = useAppMode();
    const [userId, setUserId] = useState<string | null>(auth?.currentUser?.uid || null);
    const [authChecked, setAuthChecked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const unsub = auth?.onAuthStateChanged(user => {
            setUserId(user?.uid || null);
            setAuthChecked(true);
        });
        return () => unsub?.();
    }, []);

    useEffect(() => {
        if (!authChecked) return;
        if (!userId || !db) { 
            if (loading) setLoading(false); 
            return; 
        }

        // 3-second timeout fallback so profile never hangs
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 3000);

        const fetchData = async () => {
            try {
                const listingsQ = query(
                    collection(db as any, "rentals"),
                    where("ownerId", "==", userId),
                    orderBy("createdAt", "desc")
                );
                const borrowQ = query(collection(db as any, "rentals"), where("renterId", "==", userId));

                const [userSnap, lSnap, bSnap] = await Promise.all([
                    getDoc(doc(db as any, "users", userId)),
                    getDocs(listingsQ),
                    getDocs(borrowQ)
                ]);

                if (userSnap.exists()) setUserProfile(userSnap.data());
                setMyListings(lSnap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
                setMyBorrowing(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
            } catch (err) {
                console.error("Error fetching profile data", err);
            } finally {
                clearTimeout(timeout);
                setLoading(false);
            }
        };
        fetchData();

        return () => clearTimeout(timeout);
    }, [userId, authChecked]);

    const handleLogout = async () => {
        try {
            await signOut(auth as any);
            localStorage.removeItem("iy_cached_physical_location");
            localStorage.removeItem("iy_app_mode");
            localStorage.removeItem("iy_mode_picked");
            toast.success("Logged out successfully");
            router.push("/");
        } catch {
            toast.error("Failed to log out");
        }
    };

    const handleDeleteListing = async (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        const ok = confirm("Delete this listing? This cannot be undone.");
        if (!ok) return;
        try {
            await deleteDoc(doc(db as any, "rentals", itemId));
            setMyListings(prev => prev.filter(i => i.id !== itemId));
            toast.success("Listing deleted successfully");
        } catch {
            toast.error("Failed to delete listing");
        }
    };

    const handleMarkStatus = async (e: React.MouseEvent, itemId: string, newStatus: "available" | "completed") => {
        e.stopPropagation();
        if (!db) return;
        try {
            await updateDoc(doc(db as any, "rentals", itemId), { 
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            setMyListings(prev =>
                prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i)
            );
            toast.success(newStatus === "completed" ? "Marked as sold" : "Marked as available");
        } catch {
            toast.error("Could not update status.");
        }
    };

    // Not logged in
    if (!userId && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 px-5 text-center">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-5">
                    <User className="w-10 h-10 text-blue-300" />
                </div>
                <h2 className="text-xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>You are not logged in</h2>
                <p className="text-sm font-semibold text-slate-500 mt-2 mb-8">Sign in to view your campus profile</p>
                <button onClick={() => router.push("/login")} className="h-14 px-8 rounded-2xl gradient-blue text-white font-black shadow-blue active:scale-95 transition-all">Sign In Now</button>
            </div>
        );
    }

    if (loading) return <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

    const strikes = userProfile?.strikeCount || 0;

    // Stats for the Stats tab (from Dashboard)
    const totalEarnings = myListings.filter(l => l.status === "completed").reduce((sum, l) => sum + (l.pricePerHour || 0), 0);
    const activeRentals = myListings.filter(l => l.status === "active").length;
    const totalRequests = myListings.filter(l => l.status !== "available").length;
    const completedCount = myListings.filter(l => l.status === "completed").length;

    const TABS: { id: Tab; label: string; icon: any }[] = [
        { id: "overview", label: "Overview", icon: User },
        { id: "my-items", label: "My Items", icon: Package },
        { id: "stats", label: "Stats", icon: BarChart2 },
    ];

    const displayListings = listFilter === "all" ? myListings
        : listFilter === "active" ? myListings.filter(i => i.status === "available")
        : myListings.filter(i => ["completed", "active", "requested"].includes(i.status));

    return (
        <div className="flex-1 flex flex-col min-h-screen relative pb-28" style={{ background: theme.surface }}>
            <TopBar hideSearch={true} />

            <main className="flex-1 px-5 pt-[40px] space-y-5">
                {/* Profile Header Card */}
                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex items-center gap-4 relative z-10">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full gradient-blue flex items-center justify-center text-white font-black text-2xl shadow-blue shrink-0">
                            {userProfile?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-black text-slate-800 leading-tight truncate" style={{ fontFamily: "Outfit, sans-serif" }}>
                                {userProfile?.name || "Student"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {userProfile?.department && (
                                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-widest border border-blue-100">
                                        {userProfile.department}
                                    </span>
                                )}
                                {userProfile?.reviewCount > 0 ? (
                                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                        {userProfile.overallRating?.toFixed(1)} ({userProfile.reviewCount})
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-widest">No Reviews</span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setShowMenu(true)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-100 active:scale-95 transition-all shrink-0">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Settings Sidebar/Menu Overlay */}
                    {showMenu && (
                        <div className="fixed inset-0 z-[100] flex justify-end">
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
                            <div className="relative w-[280px] h-full bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Settings</h2>
                                    <button onClick={() => setShowMenu(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2 flex-1">
                                    <button onClick={() => { setShowMenu(false); router.push("/profile/edit"); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 hover:bg-blue-50 transition-colors">
                                        <User className="w-4 h-4 text-blue-500" /> Edit Profile
                                    </button>
                                    <button onClick={() => { setShowMenu(false); router.push("/profile/history"); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 hover:bg-blue-50 transition-colors">
                                        <Clock className="w-4 h-4 text-blue-500" /> Transaction History
                                    </button>
                                    <button className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 hover:bg-blue-50 transition-colors opacity-50">
                                        <ShieldCheck className="w-4 h-4 text-blue-500" /> Security
                                    </button>
                                </div>

                                <button 
                                    onClick={handleLogout} 
                                    className="w-full h-14 rounded-2xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center gap-2 mt-auto"
                                >
                                    <LogOut className="w-5 h-5" /> Log Out
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Trust / Strike bar */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
                        {strikes === 0 ? (
                            <div className="flex items-center gap-2 text-emerald-600">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-sm font-black">Excellent Standing</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-rose-500">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-black">{strikes}/2 Strikes</span>
                            </div>
                        )}

                        {/* Mode switcher in profile */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mode:</span>
                            <button
                                onClick={() => setMode(mode === "rentals" ? "writing" : "rentals")}
                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${mode === "writing" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}
                            >
                                {mode === "writing" ? "✍️ Writing" : "📦 Rentals"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher — 3 tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === tab.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── TAB 1: OVERVIEW ── */}
                {activeTab === "overview" && (
                    <div className="space-y-4">
                        {/* Currently Borrowing */}
                        <div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Currently Renting</h2>
                            {myBorrowing.filter(i => i.status === "active").length === 0 ? (
                                <div className="bg-white rounded-2xl p-5 border border-slate-100 text-center">
                                    <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm font-semibold">No active borrows</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {myBorrowing.filter(i => i.status === "active").map(item => (
                                        <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all shadow-sm">
                                            <div className="text-2xl w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">{item.icon}</div>
                                            <div className="flex-1">
                                                <p className="font-black text-slate-800 text-sm">{item.itemName}</p>
                                                <p className="text-xs text-blue-500 font-bold">{item.block}</p>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded-md">Active</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => router.push("/profile/history")} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col gap-2 text-left shadow-sm active:scale-[0.97] transition-all">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm font-black text-slate-800">Transaction History</span>
                                </button>
                                <button onClick={() => router.push("/rentals/new")} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col gap-2 text-left shadow-sm active:scale-[0.97] transition-all">
                                    <Package className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-black text-slate-800">List New Item</span>
                                </button>
                                {mode === "writing" && (
                                    <button onClick={() => router.push("/writing/new")} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col gap-2 text-left shadow-sm active:scale-[0.97] transition-all">
                                        <PenTool className="w-5 h-5 text-amber-500" />
                                        <span className="text-sm font-black text-slate-800">Post Writing Job</span>
                                    </button>
                                )}
                                <button onClick={() => router.push("/leaderboard")} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col gap-2 text-left shadow-sm active:scale-[0.97] transition-all">
                                    <Star className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm font-black text-slate-800">Campus Leaderboard</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 2: MY ITEMS ── */}
                {activeTab === "my-items" && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Listings ({myListings.length})</h2>
                            <button onClick={() => router.push("/rentals/new")} className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors">+ List Item</button>
                        </div>
                        
                        <div className="flex gap-2">
                            {["all", "active", "sold_borrowed"].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setListFilter(f)}
                                    className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-full transition-all ${listFilter === f ? "bg-blue-600 text-white shadow-sm" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
                                >
                                    {f === "all" ? "All" : f === "active" ? "Active" : "Sold/Borrowed"}
                                </button>
                            ))}
                        </div>

                        {displayListings.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
                                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-500 font-semibold text-sm">No listings found.</p>
                            </div>
                        ) : (
                            displayListings.map(item => (
                                <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-all shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                                            {item.photoUrl ? <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">{item.icon}</div>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-800 leading-tight truncate">{item.itemName}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-blue-600">₹{item.pricePerHour}</span>
                                                <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${item.status === "available" ? "bg-emerald-50 text-emerald-600" : item.status === "active" ? "bg-blue-50 text-blue-600" : item.status === "requested" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 border-t border-slate-50 pt-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push(`/rentals/edit/${item.id}`); }}
                                            className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        {item.status === "available" ? (
                                            <button
                                                onClick={(e) => handleMarkStatus(e, item.id, "completed")}
                                                className="flex-1 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                                            >
                                                Mark Sold
                                            </button>
                                        ) : item.status === "completed" ? (
                                            <button
                                                onClick={(e) => handleMarkStatus(e, item.id, "available")}
                                                className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                                            >
                                                Mark Available
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── TAB 3: STATS (was Dashboard) ── */}
                {activeTab === "stats" && (
                    <div className="space-y-4">
                        {/* Earnings banner */}
                        <div className="gradient-blue rounded-[2rem] p-6 text-white shadow-blue relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                            <p className="text-[11px] font-black uppercase tracking-widest opacity-80">Estimated Earnings</p>
                            <p className="text-4xl font-black mt-1">₹{totalEarnings}</p>
                            <p className="text-xs opacity-70 mt-2 font-semibold">{completedCount} completed rentals</p>
                        </div>

                        {/* 4 stat cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Total Listed", value: myListings.length, icon: Package, color: "bg-blue-50 text-blue-600 border-blue-100" },
                                { label: "Active Now", value: activeRentals, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                                { label: "Requests", value: totalRequests, icon: Eye, color: "bg-amber-50 text-amber-600 border-amber-100" },
                                { label: "Completed", value: completedCount, icon: Star, color: "bg-blue-50 text-blue-600 border-blue-100" },
                            ].map(s => (
                                <div key={s.label} className={`bg-white rounded-[1.5rem] border p-4 shadow-sm space-y-2 ${s.color.split(" ")[2]}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                                        <div className={`p-1.5 rounded-lg border ${s.color}`}><s.icon className="w-3.5 h-3.5" /></div>
                                    </div>
                                    <p className="text-3xl font-black text-slate-800">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setActiveTab("my-items")} className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between text-slate-700 shadow-sm active:scale-[0.98] transition-all">
                            <div className="flex items-center gap-2 text-sm font-black">
                                <Package className="w-4 h-4 text-blue-500" />
                                View All My Listings
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
