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

// ─── Location & College ──────────────────────────────────────────────────────
export interface College {
    id: string;
    name: string;
    city?: string;
    state?: string;
    lat: number;
    lng: number;
    radiusMeters: number;
}

export interface Block {
    id: string;
    collegeId: string;
    name: string;
    lat: number;
    lng: number;
}

export interface Category {
    id: string;
    name: string;
    icon?: string;
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
    collegeId?: string; // New field for robust querying
    blockId?: string;   // New field for robust querying
    categoryId?: string; // New field for categorization
    branch?: string;     // Generic search/filter field
    yearSection?: string; // Generic search/filter field
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
