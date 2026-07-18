"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

const ProfileContent = dynamic(() => import("./ProfileContent"), {
  ssr: false,
});

function ProfileSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-screen relative pb-28" style={{ background: "#F5F7FA" }}>
      <TopBar hideSearch={true} />
      <main className="flex-1 px-5 pt-[40px] space-y-5 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white rounded-[2rem] p-5 border border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-200 rounded w-32" />
            <div className="h-4 bg-slate-200 rounded w-20" />
          </div>
        </div>

        {/* Tab Switcher Skeleton */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
          <div className="h-10 bg-slate-200 rounded-xl flex-1" />
          <div className="h-10 bg-slate-200 rounded-xl flex-1" />
          <div className="h-10 bg-slate-200 rounded-xl flex-1" />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-3">
          <div className="h-20 bg-white rounded-2xl border border-slate-100" />
          <div className="h-20 bg-white rounded-2xl border border-slate-100" />
          <div className="h-20 bg-white rounded-2xl border border-slate-100" />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
