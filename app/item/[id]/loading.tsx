export default function ItemLoading() {
    return (
        <div className="min-h-screen bg-white">
            {/* Sticky header skeleton */}
            <div className="sticky top-0 z-50 h-[52px] flex items-center justify-between px-4 bg-white border-b border-slate-100">
                <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 w-36 bg-slate-200 animate-pulse rounded" />
                <div className="flex gap-2">
                    <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
                    <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
                </div>
            </div>

            {/* Photo skeleton */}
            <div className="w-full aspect-[4/3] bg-slate-200 animate-pulse" />

            {/* Content skeleton */}
            <div className="px-4 pt-4 flex flex-col gap-5">
                {/* Price + title */}
                <div className="space-y-2">
                    <div className="h-8 w-28 bg-slate-200 animate-pulse rounded" />
                    <div className="h-5 w-2/3 bg-slate-200 animate-pulse rounded" />
                    <div className="flex gap-2 mt-2">
                        <div className="h-5 w-16 bg-slate-200 animate-pulse rounded-full" />
                        <div className="h-5 w-16 bg-slate-200 animate-pulse rounded-full" />
                    </div>
                </div>

                {/* Seller card skeleton */}
                <div className="bg-slate-50 rounded-2xl border-slate-100 border p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-slate-200 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-slate-200 animate-pulse rounded" />
                        <div className="h-3 w-24 bg-slate-200 animate-pulse rounded" />
                    </div>
                </div>

                {/* Details skeleton */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between py-1.5">
                            <div className="h-3 w-24 bg-slate-200 animate-pulse rounded" />
                            <div className="h-3 w-20 bg-slate-200 animate-pulse rounded" />
                        </div>
                    ))}
                </div>

                {/* Description skeleton */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
                    <div className="h-3 w-28 bg-slate-200 animate-pulse rounded mb-3" />
                    <div className="h-3 w-full bg-slate-200 animate-pulse rounded" />
                    <div className="h-3 w-5/6 bg-slate-200 animate-pulse rounded" />
                    <div className="h-3 w-4/6 bg-slate-200 animate-pulse rounded" />
                </div>
            </div>

            {/* Bottom action bar skeleton */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
                <div className="flex-1 h-12 rounded-2xl bg-slate-200 animate-pulse" />
            </div>
        </div>
    );
}
