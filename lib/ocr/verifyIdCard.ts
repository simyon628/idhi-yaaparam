/**
 * Roll Number Verification
 * 
 * Replaces Tesseract.js OCR (which was slow, unreliable, and broke on phone photos).
 * 
 * Strategy:
 * 1. Validate the roll number FORMAT with a regex (instant, free, automatic)
 * 2. Save ID photo to Firebase Storage for admin manual review (reliable, simple)
 * 
 * Indian engineering college roll number patterns:
 * - JNTU format: 20B91A0555 (year + branch + sequence)
 * - Common pattern: digits + letters + digits
 */

export type RollVerificationResult =
    | { status: "valid"; normalized: string }
    | { status: "invalid"; reason: string };

// Covers JNTU-affiliated colleges (AP/Telangana pattern)
// Format: 2-digit year | 1-3 letter branch code | 1-2 digits | letter | 3-4 digits
// Examples: 20B91A0555, 22EC1A0412, 19ME5A0003
const JNTU_ROLL_REGEX = /^[0-9]{2}[A-Z0-9]{2,4}[A-Z][0-9]{3,4}$/i;

// Generic Indian college roll number (letters + digits, 6-12 chars)
const GENERIC_ROLL_REGEX = /^[A-Z0-9]{6,14}$/i;

export function verifyRollNumber(rollNumber: string): RollVerificationResult {
    const trimmed = rollNumber.trim().toUpperCase().replace(/\s+/g, "");

    if (!trimmed) {
        return { status: "invalid", reason: "Roll number cannot be empty." };
    }

    if (trimmed.length < 6 || trimmed.length > 14) {
        return {
            status: "invalid",
            reason: "Roll number must be between 6 and 14 characters."
        };
    }

    // Check JNTU pattern first (most specific)
    if (JNTU_ROLL_REGEX.test(trimmed)) {
        return { status: "valid", normalized: trimmed };
    }

    // Fall back to generic pattern
    if (GENERIC_ROLL_REGEX.test(trimmed)) {
        return { status: "valid", normalized: trimmed };
    }

    return {
        status: "invalid",
        reason: "Invalid roll number format. Example: 20B91A0555"
    };
}

/**
 * Extract useful info from a valid JNTU roll number
 */
export function parseJntuRoll(roll: string) {
    const upper = roll.toUpperCase();
    const year = parseInt(upper.slice(0, 2), 10);
    const admissionYear = 2000 + year;
    const currentYear = new Date().getFullYear();
    const yearOfStudy = Math.min(4, currentYear - admissionYear + 1);

    return {
        admissionYear,
        estimatedYear: yearOfStudy,
        rollNumber: upper,
    };
}
