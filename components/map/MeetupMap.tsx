"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing } from '@/lib/types';
import { MapPin, Navigation, User } from 'lucide-react';
import { useEffect } from 'react';

// Fix Leaflet icons
const OwnerIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #4f46e5; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; items-center; justify-content: center; color: white; font-weight: 900; font-size: 14px;">ME</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const RenterIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #f59e0b; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; items-center; justify-content: center; color: white; font-weight: 900; font-size: 14px;">YOU</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

// Component to auto-zoom to fit both markers
function FitMarkers({ ownerPos, renterPos }: { ownerPos: [number, number], renterPos: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (ownerPos && renterPos) {
            const bounds = L.latLngBounds([ownerPos, renterPos]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        }
    }, [ownerPos, renterPos, map]);
    return null;
}

interface MeetupMapProps {
    rental: Listing;
    currentUserId: string;
    ownerName?: string;
    renterName?: string;
}

export default function MeetupMap({ rental, currentUserId, ownerName, renterName }: MeetupMapProps) {
    const isOwner = rental.ownerId === currentUserId;
    
    const ownerPos: [number, number] | null = rental.ownerLocation ? [rental.ownerLocation.lat, rental.ownerLocation.lng] : null;
    const renterPos: [number, number] | null = rental.renterLocation ? [rental.renterLocation.lat, rental.renterLocation.lng] : null;

    // Fallback to a default campus center if no location yet
    const defaultCenter: [number, number] = [16.5449, 81.5212];
    const initialCenter = ownerPos || renterPos || defaultCenter;

    return (
        <div className="w-full h-full relative rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <MapContainer 
                center={initialCenter} 
                zoom={18} 
                className="w-full h-full z-10"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {ownerPos && (
                    <Marker position={ownerPos} icon={isOwner ? OwnerIcon : RenterIcon}>
                        <Popup>
                            <div className="font-bold text-slate-800">{ownerName || "Owner"}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Item Owner</div>
                        </Popup>
                    </Marker>
                )}

                {renterPos && (
                    <Marker position={renterPos} icon={isOwner ? RenterIcon : OwnerIcon}>
                        <Popup>
                            <div className="font-bold text-slate-800">{renterName || "Renter"}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Borrower</div>
                        </Popup>
                    </Marker>
                )}

                {ownerPos && renterPos && <FitMarkers ownerPos={ownerPos} renterPos={renterPos} />}
            </MapContainer>

            {/* UI Overlays */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white shadow-lg flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Meeting Status</p>
                            <p className="text-sm font-black text-slate-800">Tracking both users...</p>
                        </div>
                    </div>
                    <div className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
                        <span className="text-[11px] font-black text-indigo-700">Meetup</span>
                    </div>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-6 left-4 right-4 z-[1000] pointer-events-none text-center">
                 <div className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-6 py-2.5 rounded-full text-white shadow-xl pointer-events-auto border border-white/20">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-black uppercase tracking-wider">Meet at {rental.block}</span>
                 </div>
            </div>
        </div>
    );
}
