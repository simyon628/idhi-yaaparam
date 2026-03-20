import { Metadata } from "next";
import { notFound } from "next/navigation";
import { doc, getDoc, collection, query as firestoreQuery, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { ItemDetailClient } from "@/components/item/ItemDetailClient";
import { cookies } from "next/headers";

// ── Force dynamic rendering (auth state may vary per user) ───────────────────
export const dynamic = "force-dynamic";

// ── Helper to fetch item + owner from Firestore ─────────────────────────────
async function getItemById(id: string) {
    if (!db) return null;
    const snap = await getDoc(doc(db, "rentals", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as any;
}

async function getOwnerById(ownerId: string) {
    if (!db) return null;
    const snap = await getDoc(doc(db, "users", ownerId));
    if (!snap.exists()) return null;
    const data = snap.data();
    // Count listings
    const listingsSnap = await getDocs(
        firestoreQuery(collection(db, "rentals"), where("ownerId", "==", ownerId))
    );
    return {
        id: snap.id,
        name: data.name || "Unknown",
        department: data.department,
        isVerified: data.isVerified,
        overallRating: data.overallRating,
        reviewCount: data.reviewCount,
        strikeCount: data.strikeCount ?? 0,
        createdAt: data.createdAt,
        itemsListedCount: listingsSnap.size,
        college_id: data.college_id,
    };
}

// ── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const item = await getItemById(params.id);
    if (!item) return { title: "Item not found · Idhi Yaaparam" };
    const photos: string[] = item.photos?.length ? item.photos : item.photoUrl ? [item.photoUrl] : [];
    return {
        title: `${item.itemName} · Idhi Yaaparam`,
        description: item.description ?? `${item.listingType === "sell" ? "For sale" : "For rent"} on campus`,
        openGraph: {
            images: photos.length > 0 ? [photos[0]] : ["/og-default.png"],
        },
    };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ItemPage({ params }: { params: { id: string } }) {
    const item = await getItemById(params.id);
    if (!item) notFound();

    const ownerData = await getOwnerById(item.ownerId);

    // NOTE: On the server side we cannot check Firebase Auth state directly.
    // We rely on the client component to determine the current user.
    // Pass null for currentUserId — client reads auth.currentUser.
    return (
        <ItemDetailClient
            item={item}
            ownerData={ownerData}
        />
    );
}
