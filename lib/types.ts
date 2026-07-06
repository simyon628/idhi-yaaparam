import { Timestamp } from "firebase/firestore";

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
    uid: string;
    phoneNumber: string;
    rollNumber: string;
    college: string;
    department?: string;
    year?: 1 | 2 | 3 | 4;          // Academic year — used for college → year → dept queries
    isVerified: boolean;
    isBlocked: boolean;
    strikeCount: number;
    idPhotoUrl?: string;            // Cloudinary URL (e.g. https://res.cloudinary.com/...)
    createdAt: Timestamp | Date;
    isAdmin?: boolean;

    // OCR Verification
    verified?: boolean;
    verifiedMethod?: 'id_ocr_v1';
    verifiedCollegeId?: string;
    verifiedRollNumber?: string;

    // Social & Trust
    overallRating?: number;
    reviewCount?: number;

    // Owner flag — distinguishes platform owner from admin
    isOwner?: boolean;
}

// ─── Banner (carousel items managed by owner) ─────────────────────────────────
export interface Banner {
    id: string;
    imageUrl: string;          // Cloudinary URL — uploaded from Owner Panel
    title: string;             // Overlay headline
    subtitle: string;          // Overlay subtext
    ctaText: string;           // Button text, e.g. "Shop Now"
    ctaLink: string;           // Deep link or URL path
    displayOrder: number;      // Controls carousel sequence
    startDate?: Timestamp | Date | null;  // Optional scheduling
    endDate?: Timestamp | Date | null;    // Optional scheduling
    isActive: boolean;         // On/off toggle
    createdAt: Timestamp | Date;
    createdBy: string;         // Owner UID
}

// ─── Student filter — for getStudents() query ─────────────────────────────────
export interface StudentFilter {
    college?: string;              // e.g. "JNTU Hyderabad" or college document ID
    year?: 1 | 2 | 3 | 4;
    department?: string;           // e.g. "CSE", "ECE"
    isVerified?: boolean;          // filter by verification status
    limit?: number;                // default 50
}

export interface College {
    id: string;
    name: string;
    aliases?: string[]; // E.g., ["SRKR", "SRREC"]
    acronym?: string;
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
    listingType?: "rent" | "buy" | "sell" | "free";
    branch?: string;     // Generic search/filter field
    yearSection?: string; // Generic search/filter field
    department?: string;
    icon: string;
    photoUrl?: string;
    status: ListingStatus;
    renterId?: string | null;
    createdAt: Timestamp | Date;
    requestedAt?: Timestamp | Date;
    requestedDuration?: string;
    approvedAt?: Timestamp | Date;
    completedAt?: Timestamp | Date;
    ownerLocation?: { lat: number, lng: number };
    renterLocation?: { lat: number, lng: number };
    condition?: "Excellent" | "Good" | "Fair"; // Item physical condition
    returnByTime?: string; // ISO string for return deadline
    expiresAt?: string; // Expiry or return deadline
    availableUntil?: string | null;
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

// ─── Chat ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
    id: string;
    rentalId: string;
    senderId: string;
    text: string;
    createdAt: Timestamp | Date;
    isRead: boolean;
}

// ─── Review ──────────────────────────────────────────────────────────────────
export interface Review {
    id: string;
    rentalId: string;
    reviewerId: string;
    reviewedUserId: string;
    rating: number; // 1-5
    comment?: string;
    createdAt: Timestamp | Date;
}

// ─── Notification ────────────────────────────────────────────────────────────
export type NotificationType = "request" | "approval" | "message" | "warning" | "system";

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string; // Optional path to navigate to (e.g. /rentals/123)
    isRead: boolean;
    createdAt: Timestamp | Date;
}


