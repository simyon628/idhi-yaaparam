import React from "react";
import { PackageOpen } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <PackageOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                {title}
            </h3>
            <p className="text-slate-500 text-sm font-medium mb-6 max-w-[250px]">
                {description}
            </p>
            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-sm"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
