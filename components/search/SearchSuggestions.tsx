import { ArrowUpLeft, Search } from "lucide-react";

export interface Suggestion {
    text: string;
    category: string;
    type: "product" | "category" | "location";
    icon?: string;
}

interface SearchSuggestionsProps {
    suggestions: Suggestion[];
    query: string;
    onSelect: (query: string) => void;
}

export function SearchSuggestions({ suggestions, query, onSelect }: SearchSuggestionsProps) {
    if (suggestions.length === 0) return null;

    return (
        <div className="absolute top-0 left-5 right-5 z-40 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
            {suggestions.map((s, i) => {
                const lowerName = s.text.toLowerCase();
                const lowerQuery = query.toLowerCase();
                const matchIndex = lowerName.indexOf(lowerQuery);
                
                let prefix = "";
                let boldPart = s.text;
                let suffix = "";

                if (matchIndex >= 0) {
                    prefix = s.text.substring(0, matchIndex);
                    boldPart = s.text.substring(matchIndex, matchIndex + query.length);
                    suffix = s.text.substring(matchIndex + query.length);
                }
                
                return (
                    <button
                        key={`${s.text}-${i}`}
                        onClick={() => onSelect(s.text)}
                        className="w-full px-5 py-3.5 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-none group active:bg-slate-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-sm border border-slate-200 group-hover:bg-white group-hover:scale-110 transition-all text-slate-400">
                                {s.icon ? s.icon : <Search className="w-4 h-4" />}
                            </div>
                            <div>
                                <div className="text-sm">
                                    <span className="font-medium text-slate-400">{prefix}</span>
                                    <span className="font-black text-slate-900">{boldPart}</span>
                                    <span className="font-medium text-slate-400">{suffix}</span>
                                </div>
                                <div className="text-[10px] font-bold text-indigo-500 mt-0.5 group-hover:translate-x-1 transition-transform inline-block uppercase tracking-wider">
                                    {s.type === 'category' ? 'Category' : `in ${s.category}`}
                                </div>
                            </div>
                        </div>
                        <ArrowUpLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 rotate-90 transition-all opacity-0 group-hover:opacity-100" />
                    </button>
                );
            })}
        </div>
    );
}
