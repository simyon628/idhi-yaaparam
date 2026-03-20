import { SearchFilter } from "@/lib/types";
import { CATEGORIES } from "@/components/ui/CategoryGrid";

interface SearchFiltersProps {
    filters: SearchFilter;
    setFilters: (filters: SearchFilter) => void;
    onApply: () => void;
}

export function SearchFilters({ filters, setFilters, onApply }: SearchFiltersProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-5 shadow-md animate-in slide-in-from-top-2">
            {/* Category */}
            <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                    {["All", ...CATEGORIES.map(c => c.name)].map(cat => {
                        const isSelected = (filters.categoryId === cat) || (cat === "All" && !filters.categoryId);
                        return (
                            <button
                                key={cat}
                                onClick={() => setFilters({ ...filters, categoryId: cat === "All" ? undefined : cat })}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                    Max Price: {filters.maxPrice ? `₹${filters.maxPrice}` : "Any"}
                </label>
                <input
                    type="range" min={10} max={1000} step={10}
                    value={filters.maxPrice || 1000}
                    onChange={e => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                />
            </div>

            {/* Condition */}
            <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Condition</label>
                <div className="flex gap-2">
                    {[{ label: "Any", val: undefined }, { label: "Excellent", val: "Excellent" }, { label: "Good", val: "Good" }, { label: "Fair", val: "Fair" }].map(c => (
                        <button
                            key={c.label}
                            onClick={() => setFilters({ ...filters, condition: c.val as any })}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${filters.condition === c.val ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort */}
            <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sort By</label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: "relevance", label: "Relevance ⭐" },
                        { key: "newest", label: "Newest" },
                        { key: "price_asc", label: "Price ↑" },
                        { key: "price_desc", label: "Price ↓" }
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setFilters({ ...filters, sort: s.key as any })}
                            className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${filters.sort === s.key || (!filters.sort && s.key === "relevance") ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={onApply}
                className="w-full h-11 rounded-xl bg-indigo-600 text-white font-black text-sm active:scale-95 transition-transform"
            >
                Apply Filters
            </button>
        </div>
    );
}
