/* eslint-disable */
"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing } from '@/lib/types';
import { IndianRupee, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Fix Leaflet's default icon path issues in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface CampusMapProps {
    center: [number, number];
    items: Listing[];
}

export default function CampusMap({ center, items }: CampusMapProps) {
    const router = useRouter();

    return (
        <div className="w-full h-full relative animate-page-enter">
            <MapContainer 
                center={center} 
                zoom={17} 
                className="w-full h-full"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {items.map((item, idx) => {
                    // Fallback to center with jitted offset if no location data exists
                    // Ideally we'd map blockId to coords, but for now we use ownerLocation if available
                    const lat = item.ownerLocation?.lat || center[0] + (Math.random() - 0.5) * 0.003;
                    const lng = item.ownerLocation?.lng || center[1] + (Math.random() - 0.5) * 0.003;

                    return (
                        <Marker key={item.id} position={[lat, lng]}>
                            <Popup>
                                <div className="p-0.5 min-w-[140px] font-sans">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-lg overflow-hidden shrink-0">
                                            {item.photoUrl ? (
                                                <img src={item.photoUrl} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                item.icon || '📦'
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-black text-slate-800 text-[11px] truncate leading-tight">{item.itemName}</h4>
                                            <span className="text-[10px] font-bold text-slate-400 truncate flex items-center gap-0.5">
                                                <MapPin className="w-2 h-2" /> {item.block}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 mt-2">
                                        <div className="flex items-center gap-0.5 font-black text-indigo-600 text-[11px]">
                                            <IndianRupee className="w-2.5 h-2.5" />
                                            {item.pricePerHour}
                                        </div>
                                        <button 
                                            onClick={() => router.push(`/rentals/${item.id}`)}
                                            className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow-sm active:scale-95 transition-transform"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Hint overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Live Campus Map</span>
                </div>
            </div>
        </div>
    );
}
