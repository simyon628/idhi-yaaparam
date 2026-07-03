/**
 * lib/firebase-queries.ts
 *
 * All Firestore query helpers for Idhi Yaaparam.
 * Import these instead of writing raw Firestore calls everywhere.
 *
 * Core query: getStudents({ college, year, department })
 * Uses composite index: college ASC + year ASC + department ASC + createdAt DESC
 * Deploy indexes first: firebase deploy --only firestore:indexes
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Query,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { User, Listing, StudentFilter } from "./types";

// ─── Helper: snapshot → typed array ──────────────────────────────────────────
function snapToArray<T>(snap: QuerySnapshot<DocumentData>): T[] {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS / STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get students filtered by any combination of college, year, department.
 *
 * Examples:
 *   getStudents({ college: "JNTU Hyderabad" })
 *   getStudents({ college: "JNTU Hyderabad", year: 2 })
 *   getStudents({ college: "JNTU Hyderabad", year: 2, department: "CSE" })
 *   getStudents({ department: "ECE", isVerified: true })
 *
 * Requires composite index:
 *   collection: users
 *   fields: college ASC, year ASC, department ASC, createdAt DESC
 */
export async function getStudents(filter: StudentFilter): Promise<User[]> {
  if (!db) throw new Error("Firestore not initialized");

  const usersRef = collection(db, "users");
  const constraints: Parameters<typeof query>[1][] = [];

  if (filter.college)    constraints.push(where("college",    "==", filter.college));
  if (filter.year)       constraints.push(where("year",       "==", filter.year));
  if (filter.department) constraints.push(where("department", "==", filter.department));
  if (filter.isVerified !== undefined) constraints.push(where("isVerified", "==", filter.isVerified));

  // Always sort newest first
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(fsLimit(filter.limit ?? 50));

  const q: Query<DocumentData> = query(usersRef, ...constraints);
  const snap = await getDocs(q);
  return snapToArray<User>(snap);
}

/**
 * Count students per department for a given college & year.
 * Returns: { CSE: 45, ECE: 32, MECH: 20, ... }
 */
export async function countStudentsByDepartment(
  college: string,
  year?: 1 | 2 | 3 | 4
): Promise<Record<string, number>> {
  const students = await getStudents({ college, year, limit: 500 });
  return students.reduce<Record<string, number>>((acc, s) => {
    const dept = s.department ?? "Unknown";
    acc[dept] = (acc[dept] ?? 0) + 1;
    return acc;
  }, {});
}

/**
 * Get a single user by their UID.
 */
export async function getUserById(uid: string): Promise<User | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as unknown as User;
}

/**
 * Update a user's year and/or department.
 * Call this when a student completes their profile.
 */
export async function updateStudentProfile(
  uid: string,
  updates: {
    year?: 1 | 2 | 3 | 4;
    department?: string;
    idPhotoUrl?: string;
  }
): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, "users", uid), updates as DocumentData);
}

// ─────────────────────────────────────────────────────────────────────────────
// RENTALS / LISTINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get available listings for a college, optionally filtered by category.
 * Uses index: collegeId ASC + status ASC + createdAt DESC
 */
export async function getCollegeListings(options: {
  collegeId: string;
  categoryId?: string;
  status?: "available" | "active" | "completed" | "cancelled" | "requested";
  limitCount?: number;
}): Promise<Listing[]> {
  if (!db) throw new Error("Firestore not initialized");

  const rentalsRef = collection(db, "rentals");
  const constraints: Parameters<typeof query>[1][] = [
    where("collegeId", "==", options.collegeId),
    where("status",    "==", options.status ?? "available"),
  ];

  if (options.categoryId) {
    constraints.push(where("categoryId", "==", options.categoryId));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(fsLimit(options.limitCount ?? 50));

  const q = query(rentalsRef, ...constraints);
  const snap = await getDocs(q);
  return snapToArray<Listing>(snap);
}

/**
 * Get all listings by a specific owner.
 * Uses index: ownerId ASC + status ASC + createdAt DESC
 */
export async function getOwnerListings(
  ownerId: string,
  status?: Listing["status"]
): Promise<Listing[]> {
  if (!db) throw new Error("Firestore not initialized");

  const constraints: Parameters<typeof query>[1][] = [
    where("ownerId", "==", ownerId),
  ];
  if (status) constraints.push(where("status", "==", status));
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(fsLimit(100));

  const q = query(collection(db, "rentals"), ...constraints);
  const snap = await getDocs(q);
  return snapToArray<Listing>(snap);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count unread notifications for a user.
 * Uses index: userId ASC + isRead ASC + createdAt DESC
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!db) return 0;
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("isRead", "==", false),
    fsLimit(99)
  );
  const snap = await getDocs(q);
  return snap.size;
}
