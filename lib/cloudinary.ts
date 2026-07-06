/**
 * lib/cloudinary.ts
 *
 * Cloudinary image upload utility for Idhi Yaaparam.
 * Replaces direct Firebase Storage uploads for ID cards and product photos.
 *
 * Setup (one time):
 * 1. Create free account at https://cloudinary.com
 * 2. Go to Settings → Upload → Upload Presets → Add unsigned preset
 * 3. Name it "id_cards" (for student IDs) and "products" (for rental items)
 * 4. Add to .env.local:
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *
 * Usage:
 *   const url = await uploadIdCard(file, userId);
 *   await updateStudentProfile(userId, { idPhotoUrl: url });
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// ─── Upload presets (create these in Cloudinary dashboard) ───────────────────
const PRESETS = {
  idCard:  "id_cards",   // unsigned preset for student ID cards
  product: "products",   // unsigned preset for rental item photos
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CloudinaryUploadResult {
  secureUrl: string;      // Full HTTPS URL — store this in Firestore
  publicId: string;       // Use this to delete/replace the image later
  width: number;
  height: number;
  bytes: number;
}

// ─── Core upload function ─────────────────────────────────────────────────────
async function uploadToCloudinary(
  file: File | Blob,
  preset: string,
  folder: string,
  publicId?: string
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set in .env.local. " +
      "Add it to enable image uploads."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  formData.append("folder", folder);
  if (publicId) formData.append("public_id", publicId);

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Cloudinary upload failed: ${err?.error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  return {
    secureUrl: data.secure_url as string,
    publicId:  data.public_id  as string,
    width:     data.width      as number,
    height:    data.height     as number,
    bytes:     data.bytes      as number,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a student's ID card to Cloudinary.
 * Store the returned URL in Firestore: users/{uid}.idPhotoUrl
 *
 * @param file  - The image file from <input type="file"> or camera capture
 * @param uid   - The student's Firebase Auth UID (used as the public_id)
 * @returns     - The permanent Cloudinary HTTPS URL
 *
 * Example:
 *   const url = await uploadIdCard(file, auth.currentUser.uid);
 *   await updateStudentProfile(auth.currentUser.uid, { idPhotoUrl: url });
 */
export async function uploadIdCard(
  file: File | Blob,
  uid: string
): Promise<string> {
  const result = await uploadToCloudinary(
    file,
    PRESETS.idCard,
    "id_cards",
    `id_cards/${uid}` // one ID card per user — overwrites the old one automatically
  );
  return result.secureUrl;
}

/**
 * Upload a rental/product photo to Cloudinary.
 * Store the returned URL in Firestore: rentals/{rentalId}.photoUrl
 *
 * @param file      - The image file
 * @param rentalId  - The Firestore rental document ID
 * @returns         - The permanent Cloudinary HTTPS URL
 *
 * Example:
 *   const url = await uploadProductPhoto(file, rentalDoc.id);
 *   await updateDoc(doc(db, "rentals", rentalDoc.id), { photoUrl: url });
 */
export async function uploadProductPhoto(
  file: File | Blob,
  rentalId: string
): Promise<string> {
  const result = await uploadToCloudinary(
    file,
    PRESETS.product,
    "products",
    `products/${rentalId}_${Date.now()}`
  );
  return result.secureUrl;
}

/**
 * Upload a chat image to Cloudinary.
 *
 * @param file    - The image file
 * @param chatId  - The chat session/rental ID
 * @returns       - The permanent Cloudinary HTTPS URL
 */
export async function uploadChatImage(
  file: File | Blob,
  chatId: string
): Promise<string> {
  const result = await uploadToCloudinary(
    file,
    PRESETS.product, // reusing product preset or we can create a chat preset, let's use product for now
    "chat_images",
    `chat/${chatId}/${Date.now()}`
  );
  return result.secureUrl;
}

/**
 * Upload a carousel banner image to Cloudinary.
 * Used by the Owner Panel to add/update banner images.
 *
 * @param file      - The image file from phone gallery or camera
 * @param bannerId  - Optional banner ID (for replacing an existing image)
 * @returns         - The permanent Cloudinary HTTPS URL
 *
 * Example:
 *   const url = await uploadBannerImage(file, "banner_diwali_2026");
 *   // Save this URL in Firestore: banners/{bannerId}.imageUrl
 */
export async function uploadBannerImage(
  file: File | Blob,
  bannerId?: string
): Promise<string> {
  const result = await uploadToCloudinary(
    file,
    PRESETS.product, // reuse products preset or create a "banners" preset
    "banners",
    bannerId ? `banners/${bannerId}` : `banners/banner_${Date.now()}`
  );
  return result.secureUrl;
}

/** Convenience — returns a banner-optimized image URL (wide format, max 800px) */
export const bannerUrl = (url: string | null | undefined) =>
  cloudinaryUrl(url, { w: 800, h: 320, crop: "fill" });

// ─────────────────────────────────────────────────────────────────────────────
// URL HELPERS — get different sizes from the same Cloudinary URL
// No extra uploads needed — Cloudinary handles resizing on the fly
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transform a Cloudinary URL to a specific size.
 *
 * Example:
 *   cloudinaryUrl(user.idPhotoUrl, { w: 80, h: 80, crop: "fill" })
 *   // → thumbnail for the student list
 *
 *   cloudinaryUrl(user.idPhotoUrl, { w: 400, h: 250 })
 *   // → full-size ID card view
 */
export function cloudinaryUrl(
  url: string | undefined | null,
  options: {
    w?: number;
    h?: number;
    crop?: "fill" | "fit" | "scale" | "thumb";
    quality?: "auto" | number;
    format?: "auto" | "webp" | "jpg";
  } = {}
): string {
  if (!url) return "";

  // Only transform Cloudinary URLs — leave everything else untouched
  if (!url.includes("cloudinary.com")) return url;

  const { w, h, crop = "fill", quality = "auto", format = "auto" } = options;

  // Build transform string: w_80,h_80,c_fill,q_auto,f_auto
  const transforms: string[] = [];
  if (w)       transforms.push(`w_${w}`);
  if (h)       transforms.push(`h_${h}`);
  if (w || h)  transforms.push(`c_${crop}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);

  const transformStr = transforms.join(",");

  // Insert transform before the version or filename in the URL
  // e.g. .../upload/v1234/id_cards/uid.jpg → .../upload/w_80,h_80,c_fill/v1234/id_cards/uid.jpg
  return url.replace("/upload/", `/upload/${transformStr}/`);
}

/** Convenience — returns an 80×80 thumbnail URL (for student lists, avatars) */
export const thumbnailUrl = (url: string | null | undefined) =>
  cloudinaryUrl(url, { w: 80, h: 80, crop: "fill" });

/** Convenience — returns a 400×250 card image (for rental cards) */
export const cardUrl = (url: string | null | undefined) =>
  cloudinaryUrl(url, { w: 400, h: 250, crop: "fill" });

/** Convenience — returns a full-width detail image (up to 800px wide) */
export const detailUrl = (url: string | null | undefined) =>
  cloudinaryUrl(url, { w: 800, crop: "fit" });
