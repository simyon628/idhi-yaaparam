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

    // OCR Verification
    verified?: boolean;
    verifiedMethod?: 'id_ocr_v1';
    verifiedCollegeId?: string;
    verifiedRollNumber?: string;
}

export interface College {
    id: string;
    name: string;
    aliases?: string[]; // E.g., ["SRKR", "SRREC"]
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
    ownerLocation?: { lat: number, lng: number };
    renterLocation?: { lat: number, lng: number };
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

export interface WritingJob {
    id?: string;
    title: string;
    description: string;
    type: "Assignment" | "Record" | "Project Report" | "Other";
    price: number;
    deadline: any; // Firestore Timestamp
    college: string;
    department?: string;
    posterId: string;
    workerId: string | null;
    status: "open" | "assigned" | "completed" | "cancelled";
    createdAt: any;
}
