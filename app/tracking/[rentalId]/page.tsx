"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { db, auth } from "@/lib/firebase";
import {
  doc, onSnapshot, updateDoc, serverTimestamp, getDoc, addDoc, collection,
} from "firebase/firestore";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Listing } from "@/lib/types";
import { TrackingPhase } from "@/lib/map/LiveTrackingMap";

// ── Dynamic imports (no SSR) ──────────────────────────────────────────────────
const LiveTrackingMap = dynamic(
  () => import("@/lib/map/LiveTrackingMap"),
  { ssr: false, loading: () => <MapSkeleton /> }
);
const LiveTrackingBottomCard = dynamic(
  () => import("@/components/rental/LiveTrackingBottomCard"),
  { ssr: false }
);

function MapSkeleton() {
  return (
    <div style={{ flex: 1, background: "linear-gradient(135deg,#f0eeff,#e8f5ff)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Loader2 style={{ width: 32, height: 32, color: "#7C3AED", animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED" }}>Loading live map…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Haversine ─────────────────────────────────────────────────────────────────
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180, Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ── Mock rentals for demo (same IDs as rental page) ──────────────────────────
const MOCK_RENTAL: Listing = {
  id: "demo",
  ownerId: "owner123",
  renterId: "renter456",
  itemName: "Casio fx-991EX",
  pricePerHour: 15,
  block: "A-Block",
  condition: "Excellent",
  status: "active",
  listingType: "rent",
  icon: "🧮",
  photoUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
  createdAt: new Date(),
  ownerLocation: { lat: 16.5449, lng: 81.5212 },
  renterLocation: { lat: 16.5459, lng: 81.5222 },
};

// ── Demo simulation (for preview when no real GPS) ────────────────────────────
function useDemoSimulation(rentalId: string, enabled: boolean) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepRef = useRef(0);
  const [simRental, setSimRental] = useState<Partial<Listing>>({
    ownerLocation: { lat: 16.5449, lng: 81.5212 },
    renterLocation: { lat: 16.5469, lng: 81.5232 },
  });

  useEffect(() => {
    if (!enabled) return;
    intervalRef.current = setInterval(() => {
      stepRef.current++;
      const t = stepRef.current;
      // Borrower walks toward owner
      const ownerLat = 16.5449, ownerLng = 81.5212;
      const startLat = 16.5469, startLng = 81.5232;
      const progress = Math.min(1, t * 0.04);
      setSimRental({
        ownerLocation: { lat: ownerLat, lng: ownerLng },
        renterLocation: {
          lat: startLat + (ownerLat - startLat) * progress,
          lng: startLng + (ownerLng - startLng) * progress,
        },
      });
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [enabled]);

  return simRental;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LiveTrackingPage() {
  const { rentalId } = useParams<{ rentalId: string }>();
  const router = useRouter();

  const [rental, setRental] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);
  const [renterInfo, setRenterInfo] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hapticFired, setHapticFired] = useState(false);
  const lastCoordsRef = useRef<{ lat: number, lng: number } | null>(null);

  // Demo: seed both profiles for the demo rental
  const [demoOwnerInfo] = useState({ name: "Rahul Verma", department: "CSE", rollNumber: "22CSE1001", college: "SVEC", isVerified: true, overallRating: 4.8, reviewCount: 36, phone: "+919876543210" });
  const [demoRenterInfo] = useState({ name: "You (Demo)", department: "IT", rollNumber: "22IT2099", college: "SVEC", isVerified: true, overallRating: 4.5, reviewCount: 12 });

  // Demo simulation toggle
  const isDemo = rentalId === "demo";
  const simData = useDemoSimulation(rentalId, isDemo);

  // Auth
  useEffect(() => {
    const unsub = auth?.onAuthStateChanged(u => setUserId(u?.uid ?? null));
    return () => unsub?.();
  }, []);

  // Firestore real-time listener
  useEffect(() => {
    if (isDemo) {
      setRental(MOCK_RENTAL);
      // ownerInfo/renterInfo for demo come from demoOwnerInfo/demoRenterInfo state above
      setLoading(false);
      return;
    }

    if (!db || !rentalId) return;

    const timeout = setTimeout(() => setLoading(false), 5000);
    const unsub = onSnapshot(doc(db as any, "rentals", rentalId), async snap => {
      clearTimeout(timeout);
      if (!snap.exists()) { toast.error("Rental not found"); router.back(); return; }
      const data = { id: snap.id, ...snap.data() } as Listing;
      setRental(data);
      setLoading(false);

      // Fetch user profiles
      try {
        if (data.ownerId) {
          const s = await getDoc(doc(db as any, "users", data.ownerId));
          if (s.exists()) setOwnerInfo(s.data());
        }
        if (data.renterId) {
          const s = await getDoc(doc(db as any, "users", data.renterId));
          if (s.exists()) setRenterInfo(s.data());
        }
      } catch { /* unauthenticated */ }
    }, err => {
      clearTimeout(timeout);
      console.warn("Tracking page error:", err);
      setLoading(false);
    });

    return () => { clearTimeout(timeout); unsub(); };
  }, [rentalId, isDemo, router]);

  // Live GPS push (real sessions)
  useEffect(() => {
    if (isDemo || !db || !userId || !rental) return;
    if (rental.status !== "requested" && rental.status !== "active") return;
    const isOwner = rental.ownerId === userId;
    const isRenter = rental.renterId === userId;
    if (!isOwner && !isRenter) return;

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        
        if (lastCoordsRef.current) {
          const dist = getDistanceMeters(
            lastCoordsRef.current.lat, lastCoordsRef.current.lng,
            latitude, longitude
          );
          // Only update if moved more than 10 meters to avoid infinite loop
          if (dist < 10) {
            console.log(`GPS throttle: moved only ${dist}m. Skipping Firestore push.`);
            return;
          }
        }
        
        lastCoordsRef.current = { lat: latitude, lng: longitude };
        updateDoc(doc(db as any, "rentals", rentalId), {
          [isOwner ? "ownerLocation" : "renterLocation"]: { lat: latitude, lng: longitude },
          lastLocationUpdate: serverTimestamp(),
        }).catch(console.error);
      },
      err => console.warn("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [rental?.status, rental?.ownerId, rental?.renterId, userId, rentalId, isDemo]);

  // Merge simulation into rental for demo
  const effectiveRental = isDemo && rental
    ? { ...rental, ...simData }
    : rental;

  // Phase calculation
  const isOwner = userId ? rental?.ownerId === userId : false; // demo: treat as renter
  const isPending = effectiveRental?.status === "requested";
  let distanceM = 0;
  if (effectiveRental?.ownerLocation && effectiveRental?.renterLocation) {
    distanceM = getDistanceMeters(
      effectiveRental.ownerLocation.lat, effectiveRental.ownerLocation.lng,
      effectiveRental.renterLocation.lat, effectiveRental.renterLocation.lng
    );
  }
  const isArrived = distanceM > 0 && distanceM <= 100;
  const phase: TrackingPhase = isPending ? "pending" : isArrived ? "arrived" : "live";

  // Haptic nudge (once) on proximity
  useEffect(() => {
    if (isArrived && !hapticFired && typeof navigator !== "undefined") {
      if ("vibrate" in navigator) navigator.vibrate([50, 30, 50]);
      setHapticFired(true);
      toast.success("🤝 You're both here! Complete the handoff.");
    }
  }, [isArrived, hapticFired]);

  // Action handlers
  const handleQuickMessage = useCallback(async (msg: string) => {
    toast.success(`Sent: "${msg}"`);
    if (!db || !rentalId || !userId || isDemo) return;
    await addDoc(collection(db as any, "chats", rentalId, "messages"), {
      senderId: userId,
      text: msg,
      createdAt: serverTimestamp(),
      isRead: false,
    }).catch(console.error);
  }, [db, rentalId, userId, isDemo]);

  const handleMarkHandedOver = useCallback(async () => {
    toast.success("Handover confirmed! Waiting for borrower to confirm receipt.");
    if (!db || !rentalId || isDemo) return;
    await updateDoc(doc(db as any, "rentals", rentalId), {
      ownerConfirmedHandoff: true,
      handoffAt: serverTimestamp(),
    }).catch(console.error);
  }, [db, rentalId, isDemo]);

  const handleMarkReceived = useCallback(async () => {
    toast.success("🎉 Transaction complete! Both confirmed.");
    if (!db || !rentalId || isDemo) return;
    await updateDoc(doc(db as any, "rentals", rentalId), {
      renterConfirmedReceived: true,
      status: "active",
      completedAt: serverTimestamp(),
    }).catch(console.error);
  }, [db, rentalId, isDemo]);

  const activeOwner = isDemo ? demoOwnerInfo : ownerInfo;
  const activeRenter = isDemo ? demoRenterInfo : renterInfo;

  const otherUserName     = isOwner ? activeRenter?.name        : activeOwner?.name;
  const otherUserDept     = isOwner ? activeRenter?.department   : activeOwner?.department;
  const otherUserPhoto    = isOwner ? activeRenter?.photoUrl     : activeOwner?.photoUrl;
  const otherUserPhone    = isOwner ? activeRenter?.phone        : activeOwner?.phone;
  const otherUserRoll     = isOwner ? activeRenter?.rollNumber   : activeOwner?.rollNumber;
  const otherUserCollege  = isOwner ? activeRenter?.college      : activeOwner?.college;
  const otherUserRating   = isOwner ? activeRenter?.overallRating : activeOwner?.overallRating;
  const otherUserReviews  = isOwner ? activeRenter?.reviewCount  : activeOwner?.reviewCount;
  const otherUserVerified = isOwner ? activeRenter?.isVerified   : activeOwner?.isVerified;

  const etaMin = distanceM > 0 ? Math.max(1, Math.round(distanceM / 80)) : undefined;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 14, background: "#f5f3ff" }}>
        <Loader2 style={{ width: 36, height: 36, color: "#7C3AED", animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#7C3AED" }}>Loading live session...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!effectiveRental) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      background: "#0f172a", fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* ── Slim top bar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 600,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 12,
            background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft style={{ width: 20, height: 20, color: "#fff" }} />
        </button>

        <div style={{
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 20, padding: "6px 14px",
          fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: "0.04em",
        }}>
          LIVE TRACKING
        </div>

        <div style={{ width: 38 }} />
      </div>

      {/* ── Full-screen map ── */}
      <div style={{ position: "absolute", inset: 0 }}>
        <LiveTrackingMap
          rental={effectiveRental as Listing}
          currentUserId={userId ?? "demo"}
          ownerName={ownerInfo?.name}
          renterName={renterInfo?.name}
          onQuickMessage={handleQuickMessage}
          phase={phase}
        />
      </div>

      {/* ── Bottom card ── */}
      <LiveTrackingBottomCard
        rental={effectiveRental as Listing}
        currentUserId={userId ?? "demo"}
        isOwner={isOwner}
        otherUserName={otherUserName}
        otherUserPhoto={otherUserPhoto}
        otherUserDept={otherUserDept}
        otherUserPhone={otherUserPhone}
        otherUserRoll={otherUserRoll}
        otherUserCollege={otherUserCollege}
        otherUserRating={otherUserRating}
        otherUserReviewCount={otherUserReviews}
        otherUserVerified={otherUserVerified}
        etaMin={etaMin}
        distanceM={distanceM > 0 ? distanceM : undefined}
        phase={phase}
        onMarkHandedOver={handleMarkHandedOver}
        onMarkReceived={handleMarkReceived}
        onProblem={() => toast.error("Issue reported. Owner notified.")}
        onWrongItem={() => toast.error("Issue reported. Owner notified.")}
        onQuickMessage={handleQuickMessage}
      />
    </div>
  );
}
