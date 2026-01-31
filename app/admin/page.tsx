"use client";

import { useState, useEffect } from "react";
export const dynamic = "force-dynamic";
import { db, auth } from "@/lib/firebase";
import {
    collection,
    query,
    onSnapshot,
    doc,
    updateDoc,
    getDocs,
    where,
    orderBy
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldAlert, UserX, UserCheck, Loader2 } from "lucide-react";

export default function AdminPanel() {
    const [reports, setReports] = useState<any[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // In a real app, we would check if the current user has "isAdmin: true"

    useEffect(() => {
        if (!db) return;
        // Listen for Reports
        const qReports = query(collection(db, "reports"), orderBy("timestamp", "desc"));
        const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
            setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Listen for Blocked Users
        const qBlocked = query(collection(db, "users"), where("isBlocked", "==", true));
        const unsubscribeBlocked = onSnapshot(qBlocked, (snapshot) => {
            setBlockedUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubscribeReports();
            unsubscribeBlocked();
        };
    }, []);

    const handleUnblock = async (userId: string) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                isBlocked: false,
                reportsCount: 0
            });
            toast.success("User unblocked and strikes cleared.");
        } catch (error) {
            toast.error("Failed to unblock user.");
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 p-6 pb-20">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-zinc-900 leading-none">Admin Control</h1>
                <p className="text-zinc-500 mt-2 font-medium">Campus Trust & Safety</p>
            </header>

            <div className="space-y-8">
                {/* Statistics Card */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="rounded-[1.5rem] border-none shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reports</p>
                            <p className="text-2xl font-black">{reports.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-[1.5rem] border-none shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Blocked</p>
                            <p className="text-2xl font-black text-red-500">{blockedUsers.length}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Reports */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3" /> Recent Reports
                    </h2>
                    <div className="space-y-3">
                        {reports.length === 0 ? (
                            <p className="text-zinc-300 text-sm font-medium py-10 text-center">No reports filed yet.</p>
                        ) : (
                            reports.map(report => (
                                <div key={report.id} className="bg-white p-4 rounded-2xl border border-zinc-100 flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <p className="font-bold text-sm">Reason: {report.reason}</p>
                                        <p className="text-[10px] font-medium text-zinc-400">Renter: {report.renterRoll}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">Pending</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Blocked Users */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <UserX className="w-3 h-3" /> Blocked Users
                    </h2>
                    <div className="space-y-3">
                        {blockedUsers.length === 0 ? (
                            <p className="text-zinc-300 text-sm font-medium py-10 text-center">Campus is clean. No blocked users.</p>
                        ) : (
                            blockedUsers.map(user => (
                                <div key={user.id} className="bg-white p-4 rounded-2xl border border-zinc-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                            <UserX className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{user.rollNumber}</p>
                                            <p className="text-[10px] font-medium text-zinc-400">{user.phoneNumber}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl font-bold text-xs"
                                        onClick={() => handleUnblock(user.id)}
                                    >
                                        <UserCheck className="w-3 h-3 mr-1" /> UNBLOCK
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
