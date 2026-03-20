"use client";
import { useState, useRef, useCallback } from "react";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoCarouselProps {
    photos: string[];
    itemName: string;
}

export function PhotoCarousel({ photos: maybePhotos, itemName }: PhotoCarouselProps) {
    const photos = maybePhotos ?? [];
    const [current, setCurrent] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);

    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    // --- URL Helper ---
    const getPhotoUrl = (path: string) => {
        if (!path) return "";
        // Supabase conversion logic would go here if we weren't using Firebase
        // Since we are using Firebase, our URLs are already public "http" links.
        if (path.startsWith('http')) return path;
        return path;
    };

    // --- Touch swipe logic ---
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = useCallback((e: React.TouchEvent, total: number, setter: (n: number) => void, currentIdx: number) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        if (Math.abs(dx) < Math.abs(dy)) return; // vertical — ignore
        
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (diff > 50) setter(Math.min(currentIdx + 1, total - 1));
        if (diff < -50) setter(Math.max(currentIdx - 1, 0));
    }, []);

    const handleLightboxTouchEnd = useCallback((e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        // Swipe down to dismiss
        if (dy > 80) { setLightboxOpen(false); return; }
        if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < 40) return;
        if (dx < 0 && lightboxIndex < photos.length - 1) setLightboxIndex(i => i + 1);
        else if (dx > 0 && lightboxIndex > 0) setLightboxIndex(i => i - 1);
    }, [lightboxIndex, photos.length]);

    if (!photos || photos.length === 0) {
        return (
            <div className="w-full aspect-[4/3] bg-slate-100 flex flex-col items-center justify-center gap-3">
                <Camera className="w-12 h-12 text-slate-300" />
                <p className="text-sm text-slate-400 font-medium">No photos added</p>
            </div>
        );
    }

    return (
        <>
            {/* Carousel */}
            <div
                className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden select-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, photos.length, setCurrent, current)}
            >
                {/* Skeleton */}
                {!imgLoaded && (
                    <div className="absolute inset-0 bg-slate-200 animate-pulse z-10" />
                )}

                <img
                    src={getPhotoUrl(photos[current])}
                    alt={`${itemName} photo ${current + 1}`}
                    className="w-full h-full object-cover"
                    onLoad={() => setImgLoaded(true)}
                    onClick={() => { setLightboxIndex(current); setLightboxOpen(true); }}
                />

                {/* Dot indicators */}
                {photos.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                        {photos.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`w-2 h-2 rounded-full cursor-pointer ${i === current ? 'bg-white' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}

                {/* Count badge */}
                {photos.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/40 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20">
                        {current + 1}/{photos.length}
                    </div>
                )}
            </div>

            {/* Fullscreen Lightbox */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleLightboxTouchEnd}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white z-10"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <img
                        src={photos[lightboxIndex]}
                        alt={`${itemName} full`}
                        className="max-w-full max-h-full object-contain"
                    />

                    {/* Prev / Next buttons */}
                    {lightboxIndex > 0 && (
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 rounded-full text-white"
                            onClick={() => setLightboxIndex(i => i - 1)}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    {lightboxIndex < photos.length - 1 && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 rounded-full text-white"
                            onClick={() => setLightboxIndex(i => i + 1)}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}

                    {/* Dots */}
                    {photos.length > 1 && (
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                            {photos.map((_, i) => (
                                <div key={i} className={`rounded-full ${i === lightboxIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`} />
                            ))}
                        </div>
                    )}

                    <p className="absolute bottom-3 left-0 right-0 text-center text-white/40 text-[10px]">Swipe down to close</p>
                </div>
            )}
        </>
    );
}
