import { Timestamp } from "firebase/firestore";

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
    uid: string;
    phoneNumber: string;
    rollNumber: string;
    college: string;
    department?: string;
    isVerified: boolean;
    isBlocked: boolean;
    strikeCount: number;
    idPhotoUrl?: string;
    createdAt: Timestamp | Date;
    isAdmin?: boolean;
}

// ─── Listing (stored in Firestore "rentals" collection) ─────────────────────
export type ListingStatus =
    | "available"
    | "requested"
    | "active"
    | "completed"
    | "cancelled";

export interface Listing {
    id: string;
    ownerId: string;
    itemName: string;
    pricePerHour: number;
    block: string;
    college?: string;
    department?: string;
    icon: string;
    photoUrl?: string;
    status: ListingStatus;
    renterId?: string | null;
    createdAt: Timestamp | Date;
    requestedAt?: Timestamp | Date;
    approvedAt?: Timestamp | Date;
    completedAt?: Timestamp | Date;
}

// ─── Report ──────────────────────────────────────────────────────────────────
export type ReportReason =
    | "Item not returned"
    | "Item damaged"
    | "No-show"
    | "Fraud"
    | "Other";

export interface Report {
    id: string;
    rentalId: string;
    reporterId: string;
    reportedUserId: string;
    renterRoll: string;
    reason: ReportReason | string;
    notes?: string;
    timestamp: Timestamp | Date;
    status: "pending" | "resolved";
}
