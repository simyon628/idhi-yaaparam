"use client";

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing } from '@/lib/types';
import { MapPin } from 'lucide-react';

function FitMarkers({ ownerPos, renterPos, isApproved }: { ownerPos: [number, number] | null, renterPos: [number, number] | null, isApproved: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (isApproved && ownerPos && renterPos) {
            const bounds = L.latLngBounds([ownerPos, renterPos]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        } else if (ownerPos && map) {
            map.setView(ownerPos, 18);
        }
    }, [ownerPos, renterPos, isApproved, map]);
    return null;
}

interface MeetupMapProps {
    rental: Listing;
    currentUserId: string;
    ownerName?: string;
    renterName?: string;
}

export default function MeetupMap({ rental, currentUserId }: MeetupMapProps) {
    const ownerPos: [number, number] | null = rental.ownerLocation ? [rental.ownerLocation.lat, rental.ownerLocation.lng] : null;
    const renterPos: [number, number] | null = rental.renterLocation ? [rental.renterLocation.lat, rental.renterLocation.lng] : null;

    const defaultCenter: [number, number] = [16.5449, 81.5212];
    const initialCenter = ownerPos || renterPos || defaultCenter;

    const isPending = rental.status === "requested";
    const isApproved = ['approved', 'active', 'in_progress'].includes(rental.status);

    const prevOwnerLocRef = useRef<[number, number] | null>(null);
    const [ownerIsMoving, setOwnerIsMoving] = useState(false);

    useEffect(() => {
        if (ownerPos) {
            if (prevOwnerLocRef.current) {
                const dist = L.latLng(prevOwnerLocRef.current).distanceTo(L.latLng(ownerPos));
                setOwnerIsMoving(dist > 0.5);
            }
            prevOwnerLocRef.current = ownerPos;
        }
    }, [ownerPos]);

    const prevRenterLocRef = useRef<[number, number] | null>(null);
    const [renterIsMoving, setRenterIsMoving] = useState(false);

    useEffect(() => {
        if (renterPos) {
            if (prevRenterLocRef.current) {
                const dist = L.latLng(prevRenterLocRef.current).distanceTo(L.latLng(renterPos));
                setRenterIsMoving(dist > 0.5);
            }
            prevRenterLocRef.current = renterPos;
        }
    }, [renterPos]);

    if (!isPending && !isApproved) {
        return null;
    }

    const lenderAnimationState = ownerIsMoving ? 'running' : 'paused';
    const borrowerAnimationState = renterIsMoving ? 'running' : 'paused';

    const LenderIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; border: 2px solid #7F77DD; animation: meetupPing 2s ease-out infinite; top: -6px;"></div>
                <div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); animation: walk 0.6s ease-in-out infinite; animation-play-state: ${lenderAnimationState}; position: relative; z-index: 2; line-height: 1;">
                    🚶
                </div>
                <div style="background: #F5F3FF; color: #7F77DD; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 8px; margin-top: 3px; white-space: nowrap; position: relative; z-index: 2;">
                    Lender
                </div>
            </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30],
    });

    const BorrowerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; border: 2px solid #1D9E75; animation: meetupPing 2s ease-out infinite; top: -6px; animation-delay: 0.8s;"></div>
                <div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); animation: walk 0.6s ease-in-out infinite; animation-delay: 0.3s; animation-play-state: ${borrowerAnimationState}; position: relative; z-index: 2; line-height: 1;">
                    🚶
                </div>
                <div style="background: #E1F5EE; color: #1D9E75; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 8px; margin-top: 3px; white-space: nowrap; position: relative; z-index: 2;">
                    You
                </div>
            </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30],
    });

    let computedDistance: string | null = null;
    let computedEta: string | null = null;

    if (ownerPos && renterPos) {
        const d = L.latLng(ownerPos).distanceTo(L.latLng(renterPos));
        computedDistance = Math.round(d).toString();
        computedEta = Math.max(1, Math.round(d / 80)).toString(); // Roughly 80m per min walking
    }

    return (
        <div className="meetup-section">
            <style jsx>{`
                .meetup-section { width: 100%; }
                .section-label {
                    font-size: 11px; font-weight: 500; letter-spacing: 0.07em;
                    color: #9CA3AF; margin-bottom: 8px; text-transform: uppercase;
                }
                .map-card {
                    border-radius: 20px; overflow: hidden;
                    border: 1px solid #F3F4F6; background: white;
                }
                .status-bar {
                    height: 44px; padding: 0 14px; display: flex;
                    align-items: center; justify-content: space-between;
                    background: white; border-bottom: 1px solid #F9FAFB;
                }
                .status-left { display: flex; align-items: center; gap: 8px; }
                .status-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    background: #1D9E75; animation: meetupPulse 1.5s ease-in-out infinite;
                }
                .status-text { font-size: 12px; color: #6B7280; font-weight: 500; }
                .distance-badge {
                    background: #F5F3FF; border-radius: 20px; padding: 3px 10px;
                    font-size: 11px; font-weight: 500; color: #7F77DD;
                }
                .map-container {
                    height: 200px; position: relative; overflow: hidden;
                    mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
                }
                .meet-btn {
                    position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
                    z-index: 1000; background: white; border: 1px solid #E5E7EB;
                    border-radius: 20px; padding: 7px 18px; font-size: 12px;
                    font-weight: 500; color: #374151; display: flex;
                    align-items: center; gap: 6px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                    cursor: pointer; white-space: nowrap; transition: background 0.2s;
                }
                .meet-btn:hover { background: #F9FAFB; }
                .bottom-bar {
                    height: 44px; padding: 0 14px; display: flex;
                    align-items: center; justify-content: space-between;
                    background: white; border-top: 1px solid #F9FAFB;
                }
                .bottom-left { display: flex; align-items: center; gap: 8px; }
                .emojis { display: flex; gap: 2px; font-size: 16px; align-items: center; }
                .bottom-text { font-size: 12px; color: #6B7280; font-weight: 500; }
                .eta-text { font-size: 12px; font-weight: 600; color: #1D9E75; }
                
                .overlay {
                    position: absolute; inset: 0; z-index: 999;
                    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(2px);
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; text-align: center;
                }
                .overlay-emoji { font-size: 36px; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
                .overlay-title { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 2px; }
                .overlay-subtitle { font-size: 12px; color: #9CA3AF; font-weight: 500; }

                @global {
                    @keyframes walk {
                        0%   { transform: translateY(0px) rotate(-3deg); }
                        25%  { transform: translateY(-3px) rotate(0deg); }
                        50%  { transform: translateY(0px) rotate(3deg); }
                        75%  { transform: translateY(-2px) rotate(0deg); }
                        100% { transform: translateY(0px) rotate(-3deg); }
                    }
                    @keyframes meetupPulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.3; }
                    }
                    @keyframes meetupPing {
                        0% { transform: scale(1); opacity: 0.7; }
                        100% { transform: scale(2.8); opacity: 0; }
                    }
                    .leaflet-control-zoom { display: none !important; }
                    .leaflet-control-attribution { display: none !important; }
                    .leaflet-control-container { display: none !important; }
                }

                /* Fallback for global keyframes inside JSX if needed */
                @keyframes walk {
                    0%   { transform: translateY(0px) rotate(-3deg); }
                    25%  { transform: translateY(-3px) rotate(0deg); }
                    50%  { transform: translateY(0px) rotate(3deg); }
                    75%  { transform: translateY(-2px) rotate(0deg); }
                    100% { transform: translateY(0px) rotate(-3deg); }
                }
                @keyframes meetupPing {
                    0% { transform: scale(1); opacity: 0.7; }
                    100% { transform: scale(2.8); opacity: 0; }
                }
            `}</style>
            
            <p className="section-label">MEETUP LOCATION</p>

            <div className="map-card">
                <div className="status-bar">
                    <div className="status-left">
                        <div className="status-dot"></div>
                        <span className="status-text">
                            {isPending ? "Waiting for approval" : "Tracking both users"}
                        </span>
                    </div>
                    <div className="distance-badge">
                        {isPending ? "Pending..." : (computedDistance ? "~" + computedDistance + "m apart" : "Locating...")}
                    </div>
                </div>

                <div className="map-container">
                    <MapContainer 
                        center={initialCenter} 
                        zoom={18} 
                        className="w-full h-full z-10"
                        zoomControl={false}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        
                        {ownerPos && (
                            <Marker position={ownerPos} icon={LenderIcon} />
                        )}

                        {isApproved && renterPos && (
                            <Marker position={renterPos} icon={BorrowerIcon} />
                        )}

                        <FitMarkers ownerPos={ownerPos} renterPos={renterPos} isApproved={isApproved} />
                    </MapContainer>
                    
                    {isPending && (
                        <div className="overlay">
                            <div className="overlay-emoji">🚶</div>
                            <div className="overlay-title">Waiting for owner to approve...</div>
                            <div className="overlay-subtitle">Live tracking starts after approval</div>
                        </div>
                    )}

                    <button className="meet-btn">
                        <MapPin size={14} color="#7F77DD" />
                        <span>Meet at {rental.block || "Main Block"}</span>
                    </button>
                </div>

                <div className="bottom-bar">
                    <div className="bottom-left">
                        <div className="emojis">🚶🚶</div>
                        <span className="bottom-text">
                            {isPending ? "Waiting for approval" : "Both walking toward you"}
                        </span>
                    </div>
                    <div>
                        {isApproved && computedEta && <span className="eta-text">~{computedEta} min away</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
