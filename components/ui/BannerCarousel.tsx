"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface BannerCarouselProps {
  images: string[];
}

export function BannerCarousel({ images }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3500); // 3.5 seconds auto-scroll
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  useEffect(() => {
    if (images.length > 0) {
      startAutoPlay();
    }
    return () => stopAutoPlay();
  }, [images]);

  if (!images || images.length === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    stopAutoPlay();
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Next banner
      setCurrentIndex((prev) => (prev + 1) % images.length);
    } else if (isRightSwipe) {
      // Previous banner
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }

    setTouchStart(null);
    setTouchEnd(null);
    startAutoPlay();
  };

  return (
    <div 
      className="relative w-full overflow-hidden shadow-md"
      style={{ 
        height: 180, 
        borderRadius: 18,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)` 
        }}
      >
        {images.map((src, index) => (
          <div 
            key={index} 
            className="relative w-full h-full flex-shrink-0"
            style={{ width: "100%", height: "100%" }}
          >
            <Image
              src={src}
              alt={`Banner ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
            />
          </div>
        ))}
      </div>

      {/* Pagination Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                stopAutoPlay();
                setCurrentIndex(i);
                startAutoPlay();
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-5 bg-white" : "bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
