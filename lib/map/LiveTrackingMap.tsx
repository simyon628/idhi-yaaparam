/* eslint-disable */
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TrackingPhase = 'pending' | 'live' | 'arrived';

interface LiveTrackingMapProps {
  rental: Listing;
  currentUserId: string;
  ownerName?: string;
  renterName?: string;
  onQuickMessage?: (msg: string) => void;
  phase?: TrackingPhase;
}

// ─── Haversine Distance ───────────────────────────────────────────────────────
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180, Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ─── Easing ───────────────────────────────────────────────────────────────────
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Smooth 60fps position interpolation (dead reckoning) ─────────────────────
// Animates a marker smoothly from its last position to the new target.
// Uses requestAnimationFrame for 60fps. On low-end devices this naturally
// drops to 30fps without jank because rAF respects device capabilities.
function useSmoothPosition(
  target: [number, number] | null,
  durationMs = 2000
): [number, number] | null {
  const currentRef = useRef<[number, number] | null>(null);
  const [display, setDisplay] = useState<[number, number] | null>(null);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<[number, number] | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!target) return;
    const from = currentRef.current ?? target;

    // Skip animation if distance is negligible (<0.5m) to avoid drift
    const dist = getDistanceMeters(from[0], from[1], target[0], target[1]);
    if (dist < 0.5) {
      setTimeout(() => setDisplay(target), 0);
      currentRef.current = target;
      return;
    }

    startRef.current = from;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      if (!startRef.current || !startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const e = easeInOutCubic(t);

      const lat = startRef.current[0] + (target[0] - startRef.current[0]) * e;
      const lng = startRef.current[1] + (target[1] - startRef.current[1]) * e;
      setDisplay([lat, lng]);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        currentRef.current = target;
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [target?.[0], target?.[1], durationMs]);

  return display;
}

// ─── OSRM Route Hook ──────────────────────────────────────────────────────────
// Fetches a real street path from the public OSRM walking API.
// Caches last result to avoid re-fetching on every render cycle.
// Falls back to straight-line dashed path if OSRM is unavailable.
function useOSRMRoute(
  ownerPos: [number, number] | null,
  renterPos: [number, number] | null
): { coords: [number, number][]; isStreet: boolean } {
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [isStreet, setIsStreet] = useState(false);
  const cacheRef = useRef<{ key: string; coords: [number, number][]; isStreet: boolean } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch_ = useCallback(async (
    oPos: [number, number],
    rPos: [number, number]
  ) => {
    const cacheKey = `${oPos[0].toFixed(4)},${oPos[1].toFixed(4)}-${rPos[0].toFixed(4)},${rPos[1].toFixed(4)}`;

    // Return cached result if positions haven't meaningfully changed
    if (cacheRef.current?.key === cacheKey) return;

    // Only re-route if either person has moved >30m from cache origin
    if (cacheRef.current) {
      const oldKey = cacheRef.current.key.split('-');
      const [oLat, oLng] = oldKey[0].split(',').map(Number);
      const dist = getDistanceMeters(oPos[0], oPos[1], oLat, oLng);
      if (dist < 30) return; // throttle — don't re-route for minor movements
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${oPos[1]},${oPos[0]};${rPos[1]},${rPos[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url, {
        signal: abortRef.current.signal,
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) throw new Error('OSRM unavailable');
      const json = await res.json();

      if (json.code !== 'Ok' || !json.routes?.[0]) throw new Error('No route');

      const rawCoords: [number, number][] = json.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      cacheRef.current = { key: cacheKey, coords: rawCoords, isStreet: true };
      setCoords(rawCoords);
      setIsStreet(true);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      // Fallback: straight line, visually dashed to signal degraded mode
      const fallback: [number, number][] = [oPos, rPos];
      cacheRef.current = { key: cacheKey, coords: fallback, isStreet: false };
      setCoords(fallback);
      setIsStreet(false);

      // Retry after 8 seconds (backoff)
      if (retryRef.current) clearTimeout(retryRef.current);
      retryRef.current = setTimeout(() => {
        cacheRef.current = null; // invalidate cache so next call re-fetches
        fetch_(oPos, rPos);
      }, 8000);
    }
  }, []);

  useEffect(() => {
    if (!ownerPos || !renterPos) return;
    // Throttle: only re-route when positions change meaningfully
    fetch_(ownerPos, renterPos);
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [
    ownerPos ? Math.round(ownerPos[0] * 1000) : null,
    ownerPos ? Math.round(ownerPos[1] * 1000) : null,
    renterPos ? Math.round(renterPos[0] * 1000) : null,
    renterPos ? Math.round(renterPos[1] * 1000) : null,
  ]);

  return { coords, isStreet };
}

// ─── Auto-fit map bounds ───────────────────────────────────────────────────────
function AutoFitBounds({
  ownerPos, renterPos, isArrived,
}: { ownerPos: [number, number] | null; renterPos: [number, number] | null; isArrived: boolean }) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (isArrived && ownerPos) {
      map.flyTo(ownerPos, 18, { duration: 1.0, easeLinearity: 0.5 });
      return;
    }
    if (ownerPos && renterPos) {
      const bounds = L.latLngBounds([ownerPos, renterPos]);
      // On first load animate; on subsequent updates use setView (no animation) to prevent jank
      if (!fittedRef.current) {
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17, animate: true });
        fittedRef.current = true;
      } else {
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17, animate: false });
      }
    } else if (ownerPos) {
      map.flyTo(ownerPos, 17, { duration: 1.0 });
    }
  }, [
    ownerPos?.[0], ownerPos?.[1],
    renterPos?.[0], renterPos?.[1],
    isArrived
  ]);
  return null;
}

// ─── Icon Builders ────────────────────────────────────────────────────────────
// Using CSS custom properties inside the SVG/HTML so we can change pulse color
// without recreating the icon DOM node (expensive in Leaflet).

function buildOwnerIcon(name: string | undefined, isMoving: boolean, isPending: boolean): L.DivIcon {
  const initial = name ? name.charAt(0).toUpperCase() : 'O';
  const pulse = isPending
    ? 'animation: iy-ping 2s ease-out infinite;'
    : isMoving
      ? 'animation: iy-ping 1.2s ease-out infinite;'
      : 'animation: iy-ping 2.5s ease-out infinite;';

  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;filter:drop-shadow(0 4px 12px rgba(83,74,183,0.35))">
        <div style="position:relative;width:44px;height:44px">
          <!-- Outer glow ring -->
          <div style="position:absolute;inset:-8px;border-radius:50%;
            border:2px solid rgba(83,74,183,0.5);${pulse}"></div>
          <!-- Mid glow ring -->
          <div style="position:absolute;inset:-3px;border-radius:50%;
            background:rgba(83,74,183,0.12);${pulse}animation-delay:0.4s"></div>
          <!-- Avatar circle -->
          <div style="position:absolute;inset:0;border-radius:50%;
            background:linear-gradient(135deg,#0B57D0 0%,#1A73E8 100%);
            display:flex;align-items:center;justify-content:center;
            font-size:17px;font-weight:800;color:#fff;
            border:2.5px solid #fff;
            box-shadow:0 2px 8px rgba(83,74,183,0.4);
            font-family:'DM Sans',sans-serif;">
            ${initial}
          </div>
        </div>
        <!-- Label pill -->
        <div style="background:#0B57D0;color:#fff;font-size:9px;font-weight:800;
          padding:2px 8px;border-radius:20px;white-space:nowrap;
          letter-spacing:0.06em;font-family:'DM Sans',sans-serif;
          box-shadow:0 2px 8px rgba(83,74,183,0.3);">
          OWNER
        </div>
      </div>`,
    iconSize: [44, 70],
    iconAnchor: [22, 22],
    popupAnchor: [0, -30],
  });
}

function buildRenterIcon(name: string | undefined, isMoving: boolean): L.DivIcon {
  const initial = name ? name.substring(0, 2).toUpperCase() : 'ME';
  const speed = isMoving ? '1.0s' : '2.0s';

  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;filter:drop-shadow(0 4px 12px rgba(16,185,129,0.35))">
        <div style="position:relative;width:44px;height:44px">
          <!-- Outer glow ring -->
          <div style="position:absolute;inset:-8px;border-radius:50%;
            border:2px solid rgba(16,185,129,0.5);animation:iy-ping ${speed} ease-out 0.3s infinite;"></div>
          <!-- Mid glow ring -->
          <div style="position:absolute;inset:-3px;border-radius:50%;
            background:rgba(16,185,129,0.12);animation:iy-ping ${speed} ease-out 0.7s infinite;"></div>
          <!-- Avatar circle -->
          <div style="position:absolute;inset:0;border-radius:50%;
            background:linear-gradient(135deg,#059669 0%,#10B981 100%);
            display:flex;align-items:center;justify-content:center;
            font-size:15px;font-weight:800;color:#fff;
            border:2.5px solid #fff;
            box-shadow:0 2px 8px rgba(16,185,129,0.4);
            font-family:'DM Sans',sans-serif;">
            ${initial}
          </div>
        </div>
        <!-- Label pill -->
        <div style="background:#10B981;color:#fff;font-size:9px;font-weight:800;
          padding:2px 8px;border-radius:20px;white-space:nowrap;
          letter-spacing:0.06em;font-family:'DM Sans',sans-serif;
          box-shadow:0 2px 8px rgba(16,185,129,0.3);">
          YOU
        </div>
      </div>`,
    iconSize: [44, 70],
    iconAnchor: [22, 22],
    popupAnchor: [0, -30],
  });
}

function buildMeetupIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="position:relative;width:56px;height:56px">
          <div style="position:absolute;inset:-6px;border-radius:50%;
            border:2px solid rgba(83,74,183,0.5);animation:iy-ping 1.2s ease-out infinite;"></div>
          <div style="position:absolute;inset:0;border-radius:50%;
            background:linear-gradient(135deg,#0B57D0,#1A73E8);
            display:flex;align-items:center;justify-content:center;
            font-size:22px;border:2.5px solid #fff;
            box-shadow:0 4px 16px rgba(83,74,183,0.5);">
            🤝
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#0B57D0,#1A73E8);color:#fff;
          font-size:9px;font-weight:800;padding:2px 10px;border-radius:20px;
          white-space:nowrap;letter-spacing:0.06em;
          box-shadow:0 2px 8px rgba(83,74,183,0.4);
          font-family:'DM Sans',sans-serif;">
          MET UP!
        </div>
      </div>`,
    iconSize: [56, 82],
    iconAnchor: [28, 28],
  });
}

// Dark destination pin for the meetup/block location
function buildDestinationIcon(blockName: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center">
        <!-- Pin body -->
        <div style="background:#0f172a;color:#fff;font-size:10px;font-weight:800;
          padding:5px 10px;border-radius:10px;white-space:nowrap;
          font-family:'DM Sans',sans-serif;letter-spacing:0.03em;
          box-shadow:0 4px 16px rgba(15,23,42,0.35);
          border:1.5px solid rgba(255,255,255,0.15);
          max-width:120px;overflow:hidden;text-overflow:ellipsis;">
          📍 ${blockName}
        </div>
        <!-- Pin tail -->
        <div style="width:0;height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:8px solid #0f172a;
          margin-top:-1px;">
        </div>
        <!-- Pin dot -->
        <div style="width:8px;height:8px;background:#0f172a;border-radius:50%;
          margin-top:1px;box-shadow:0 2px 6px rgba(15,23,42,0.4);">
        </div>
      </div>`,
    iconSize: [130, 52],
    iconAnchor: [65, 52],
  });
}

// ─── Global CSS (injected once into <head>) ────────────────────────────────────
const GLOBAL_CSS = `
  /* Glow ping animation */
  @keyframes iy-ping {
    0%   { transform: scale(1);   opacity: 0.8; }
    70%  { transform: scale(1.8); opacity: 0.2; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  /* Route dash flow animation */
  @keyframes iy-dash {
    to { stroke-dashoffset: -18; }
  }

  @keyframes iy-slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes iy-pulse-glow {
    0%,100% { box-shadow: 0 0 0 0 rgba(83,74,183,0.4); }
    50%     { box-shadow: 0 0 0 10px rgba(83,74,183,0); }
  }

  @keyframes iy-bounce-wait {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-6px); }
  }

  @keyframes iy-ripple {
    0%   { transform: scale(0.5); opacity: 0.8; }
    100% { transform: scale(3);   opacity: 0; }
  }

  /* Premium white map — clean & minimal like Google Maps light mode */
  .leaflet-tile {
    filter: grayscale(12%) brightness(102%) saturate(90%) !important;
  }

  /* Hide all leaflet controls */
  .leaflet-control-zoom,
  .leaflet-control-attribution,
  .leaflet-control-container { display: none !important; }

  /* Glowing animated route line */
  .iy-route-live {
    stroke-dasharray: 10 5;
    animation: iy-dash 1.4s linear infinite;
    filter: drop-shadow(0 0 5px rgba(83,74,183,0.5));
  }

  /* Prevent Leaflet marker ghost clicks on mobile */
  .leaflet-marker-icon { pointer-events: none !important; }
`;

// ─── Status bar ───────────────────────────────────────────────────────────────
function StatusBar({ phase, distanceM }: { phase: TrackingPhase; distanceM: number }) {
  const steps = [
    { key: 'pending', icon: '⏳', label: 'Awaiting' },
    { key: 'live',    icon: '🔴', label: 'Live' },
    { key: 'arrived', icon: '🤝', label: 'Arrived' },
  ];
  return (
    <div style={{
      position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)',
      zIndex: 800, display: 'flex', alignItems: 'center',
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
      borderRadius: 32, padding: '4px 6px',
      boxShadow: '0 4px 24px rgba(83,74,183,0.12)',
      border: '0.5px solid rgba(83,74,183,0.12)',
      gap: 2,
    }}>
      {steps.map((s, i) => {
        const isActive = phase === s.key;
        const isPast = steps.findIndex(x => x.key === phase) > i;
        return (
          <div key={s.key} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 24,
            background: isActive ? '#0B57D0' : 'transparent',
            color: isActive ? '#fff' : isPast ? '#10B981' : '#94a3b8',
            fontSize: 11, fontWeight: 800,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '0.04em',
            transition: 'all 0.3s ease',
          }}>
            {isPast && !isActive ? '✓' : s.icon}
            {isActive && <span>{s.label}{phase === 'live' && distanceM > 0 ? ` · ${distanceM}m` : ''}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── ETA Float ────────────────────────────────────────────────────────────────
function ETAFloat({ distanceM, etaMin }: { distanceM: number; etaMin: number }) {
  return (
    <div style={{
      position: 'absolute', bottom: '27%', left: '50%', transform: 'translateX(-50%)',
      zIndex: 800,
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
      borderRadius: 20, padding: '10px 20px',
      boxShadow: '0 8px 32px rgba(83,74,183,0.14)',
      border: '0.5px solid rgba(83,74,183,0.12)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'iy-slide-up 0.35s cubic-bezier(0.22,1,0.36,1) both',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: 20 }}>🚶</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
          ~{etaMin < 1 ? '<1' : etaMin} min away
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginLeft: 6 }}>
            · {distanceM < 1000 ? `${distanceM}m` : `${(distanceM / 1000).toFixed(1)}km`}
          </span>
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#0B57D0', letterSpacing: '0.08em' }}>
          ESTIMATED MEETUP TIME
        </div>
      </div>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'iy-pulse-glow 1.8s ease-in-out infinite' }} />
    </div>
  );
}

// ─── Arrived Banner ───────────────────────────────────────────────────────────
function ArrivedBanner({ onSend }: { onSend: (msg: string) => void }) {
  const msgs = ["I see you! 👋", "Coming down now", "I'm at the entrance 🚪"];
  return (
    <div style={{
      position: 'absolute', bottom: '27%', left: 16, right: 16,
      zIndex: 800,
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
      borderRadius: 20, padding: '14px 16px',
      boxShadow: '0 10px 40px rgba(16,185,129,0.2)',
      border: '1px solid rgba(16,185,129,0.3)',
      animation: 'iy-slide-up 0.4s cubic-bezier(0.22,1,0.36,1) both',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🎉</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
          You're both here! Complete the handoff.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {msgs.map(m => (
          <button key={m} onClick={() => onSend(m)} style={{
            padding: '7px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            border: 'none', background: '#EEF0FF', color: '#0B57D0', cursor: 'pointer',
            transition: 'transform 0.15s ease', whiteSpace: 'nowrap',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >{m}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Pending Overlay ──────────────────────────────────────────────────────────
function PendingOverlay() {
  return (
    <div style={{
      position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 900,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '16px 24px', borderRadius: 24,
      boxShadow: '0 8px 32px rgba(83,74,183,0.12)',
      border: '0.5px solid rgba(83,74,183,0.12)',
    }}>
      <div style={{ fontSize: 24, animation: 'iy-bounce-wait 1.6s ease-in-out infinite' }}>⏳</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
        Awaiting Approval
      </div>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
        Tracking starts once owner approves
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveTrackingMap({
  rental, currentUserId, ownerName, renterName, onQuickMessage, phase: phaseProp,
}: LiveTrackingMapProps) {

  // Raw positions from Firestore (updated by GPS watchPosition upstream)
  const rawOwnerPos: [number, number] | null = rental.ownerLocation
    ? [rental.ownerLocation.lat, rental.ownerLocation.lng] : null;
  const rawRenterPos: [number, number] | null = rental.renterLocation
    ? [rental.renterLocation.lat, rental.renterLocation.lng] : null;

  // Smoothly interpolated positions (60fps rAF animation)
  const ownerPos = useSmoothPosition(rawOwnerPos, 2000);
  const renterPos = useSmoothPosition(rawRenterPos, 2000);

  // Movement detection (drives glow speed)
  const prevOwnerRef = useRef<[number, number] | null>(null);
  const prevRenterRef = useRef<[number, number] | null>(null);
  const [ownerMoving, setOwnerMoving] = useState(false);
  const [renterMoving, setRenterMoving] = useState(false);

  useEffect(() => {
    if (!rawOwnerPos) return;
    if (prevOwnerRef.current) {
      const d = getDistanceMeters(prevOwnerRef.current[0], prevOwnerRef.current[1], rawOwnerPos[0], rawOwnerPos[1]);
      setOwnerMoving(d > 2);
    }
    prevOwnerRef.current = rawOwnerPos;
  }, [rawOwnerPos?.[0], rawOwnerPos?.[1]]);

  useEffect(() => {
    if (!rawRenterPos) return;
    if (prevRenterRef.current) {
      const d = getDistanceMeters(prevRenterRef.current[0], prevRenterRef.current[1], rawRenterPos[0], rawRenterPos[1]);
      setRenterMoving(d > 2);
    }
    prevRenterRef.current = rawRenterPos;
  }, [rawRenterPos?.[0], rawRenterPos?.[1]]);

  // OSRM street route (with straight-line fallback)
  const { coords: routeCoords, isStreet } = useOSRMRoute(ownerPos, renterPos);

  // Phase + distance
  const isPending = rental.status === 'requested';
  let distanceM = 0;
  if (ownerPos && renterPos) {
    distanceM = getDistanceMeters(ownerPos[0], ownerPos[1], renterPos[0], renterPos[1]);
  }
  const isArrived = distanceM > 0 && distanceM <= 100;
  const phase: TrackingPhase = phaseProp ?? (isPending ? 'pending' : isArrived ? 'arrived' : 'live');
  const etaMin = distanceM > 0 ? Math.max(1, Math.round(distanceM / 80)) : 0;

  const defaultCenter: [number, number] = rawOwnerPos ?? rawRenterPos ?? [16.5449, 81.5212];

  // Rebuild icons only when meaningful state changes — expensive Leaflet DOM
  const ownerIcon = useMemo(() => {
    if (typeof window === 'undefined') return null as any;
    if (phase === 'arrived' && ownerPos && renterPos) return buildMeetupIcon();
    return buildOwnerIcon(ownerName, ownerMoving, phase === 'pending');
  }, [phase, ownerName, ownerMoving, ownerPos, renterPos]);

  const renterIcon = useMemo(() => {
    if (typeof window === 'undefined') return null as any;
    return buildRenterIcon(renterName, renterMoving);
  }, [renterName, renterMoving]);

  const destinationIcon = useMemo(() => {
    if (typeof window === 'undefined') return null as any;
    return buildDestinationIcon(rental.block || 'Meetup Point');
  }, [rental.block]);

  const handleQuickMsg = useCallback((msg: string) => {
    onQuickMessage?.(msg);
  }, [onQuickMessage]);

  // Route polyline options
  const routeOptions = isStreet
    ? {
        color: '#0B57D0',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round' as const,
        lineJoin: 'round' as const,
        className: phase === 'live' ? 'iy-route-live' : '',
      }
    : {
        // Fallback: subtle dashed grey to indicate degraded mode
        color: '#94a3b8',
        weight: 3,
        opacity: 0.6,
        dashArray: '8 8',
        lineCap: 'round' as const,
      };

  return (
    <div className="font-sans" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'inherit' }}>
      <p className="text-slate-500 text-sm mt-1">Waiting for both parties to share location...</p>
      {/* Inject keyframes + Leaflet overrides once */}
      <style>{GLOBAL_CSS}</style>

      {/* Status bar */}
      <StatusBar phase={phase} distanceM={distanceM} />

      <MapContainer
        center={defaultCenter}
        zoom={16}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
        // Disable scroll wheel zoom on mobile to prevent accidental scroll
        scrollWheelZoom={false}
      >
        {/* White minimal tile layer — CartoCDN Positron (cleanest free tile) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Street route line */}
        {routeCoords.length >= 2 && (
          <Polyline positions={routeCoords} pathOptions={routeOptions} />
        )}

        {/* Proximity meetup zone circle (shown when close/arrived) */}
        {isArrived && ownerPos && (
          <Circle
            center={ownerPos}
            radius={80}
            pathOptions={{
              color: '#0B57D0',
              fillColor: '#0B57D0',
              fillOpacity: 0.07,
              weight: 2,
              dashArray: '5 5',
            }}
          />
        )}

        {/* Destination marker — dark pin at owner's block */}
        {ownerPos && phase !== 'arrived' && (
          <Marker position={ownerPos} icon={destinationIcon} />
        )}

        {/* Owner marker — sits on top of destination when live */}
        {ownerPos && phase !== 'arrived' && ownerIcon && (
          <Marker position={ownerPos} icon={ownerIcon} />
        )}

        {/* Merged meetup marker when arrived */}
        {phase === 'arrived' && ownerPos && renterPos && ownerIcon && (
          <Marker
            position={[
              (ownerPos[0] + renterPos[0]) / 2,
              (ownerPos[1] + renterPos[1]) / 2,
            ]}
            icon={ownerIcon}
          />
        )}

        {/* Renter/borrower marker */}
        {renterPos && phase !== 'arrived' && renterIcon && (
          <Marker position={renterPos} icon={renterIcon} />
        )}

        <AutoFitBounds ownerPos={ownerPos} renterPos={renterPos} isArrived={isArrived} />
      </MapContainer>

      {/* Pending overlay */}
      {phase === 'pending' && <PendingOverlay />}

      {/* ETA float card */}
      {phase === 'live' && ownerPos && renterPos && etaMin > 0 && (
        <ETAFloat distanceM={distanceM} etaMin={etaMin} />
      )}

      {/* Arrived banner */}
      {phase === 'arrived' && <ArrivedBanner onSend={handleQuickMsg} />}

      {/* Ripple burst on arrival */}
      {phase === 'arrived' && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(83,74,183,0.2)',
          animation: 'iy-ripple 0.9s ease-out both',
          zIndex: 700, pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}
