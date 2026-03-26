// lib/idVerification.ts
//
// Complete SRREC student ID card verification
// Handles: abbreviated names, college name variants, roll number formats,
//          Telugu college names, OCR noise, mixed case, dots/spaces in names
//
// Uses: Tesseract.js (client-side OCR) + Sharp preprocessing (server-side)
// Fuzzy match: Fuse.js (npm install fuse.js)
// No paid APIs needed.

// ─── Install these once ────────────────────────────────────────────────────────
// npm install fuse.js tesseract.js

import Tesseract from "tesseract.js";
import Fuse from "fuse.js";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface IdCardInput {
  /** Name as typed by the user during signup */
  enteredName: string;
  /** Roll number as typed by the user */
  enteredRollNumber: string;
  /** College ID as selected during signup — e.g. "mock-college-srkr" */
  enteredCollegeId: string;
  /** The ID card image file or base64 data URL */
  imageFile: File | string;
}

export interface VerificationResult {
  verified: boolean;
  confidence: number; // 0–100
  failReason?: string;
  extractedText?: string;
  details: {
    collegeFound: boolean;
    nameMatched: boolean;
    rollMatched: boolean;
    nameScore: number;    // 0–1 fuzzy score
    extractedName?: string;
    extractedRoll?: string;
  };
}

// ─── College name aliases ──────────────────────────────────────────────────────
// SRREC goes by many names on ID cards — handle all of them

const COLLEGE_ALIASES: Record<string, string[]> = {
  "mock-college-srkr": [
    // Full official names
    "sagi ramakrishnam raju engineering college",
    "sagi rama krishnam raju engineering college",
    "s.r.k.r engineering college",
    "srkr engineering college",
    // Short forms printed on cards
    "srkr",
    "s.r.k.r",
    "s r k r",
    "srkrec",
    "srkr.ac.in",
    // Sometimes printed with "autonomous"
    "sagi ramakrishnam raju engineering college (autonomous)",
    "srkr engineering college (autonomous)",
    // Location variants seen on cards
    "bhimavaram",
    // Telugu transliteration variants
    "saagi ramakrishnam raju",
    "sagi rama krishna raju",
  ],
  // Add more colleges here as you expand
};

// ─── Roll number patterns ──────────────────────────────────────────────────────
// AP engineering colleges: 10-character format like 21B91A0501
// Pattern: YY + branch code (3-4 chars) + sequence (4 digits)
// Also handles lateral entry: 22B95A0501

const ROLL_NUMBER_PATTERNS = [
  // Standard AP format: 21B91A0501, 20B91A0501
  /\b[1-2][0-9][A-Z][0-9]{2}[A-Z][0-9]{4}\b/g,
  // With spaces due to OCR: 21 B91A 0501
  /\b[1-2][0-9]\s?[A-Z][0-9]{2}\s?[A-Z][0-9]{4}\b/g,
  // Older format: 19241A0501
  /\b[1-2][0-9][0-9]{2}[0-9][A-Z][0-9]{4}\b/g,
];

// ─── Name normalization ────────────────────────────────────────────────────────
// Handles: K.A.S.R.Raju, K A S R Raju, KASR RAJU, kasrraju, etc.

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    // Remove all dots, hyphens (but keep spaces and letters)
    .replace(/\./g, " ")
    .replace(/-/g, " ")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Expand abbreviated name initials into all possible full/partial expansions.
 * "K.A.S.R.Raju" → ["k a s r raju", "kasr raju", "k a s r", "raju"]
 */
function expandAbbreviatedName(name: string): string[] {
  const normalized = normalizeName(name);
  const parts = normalized.split(" ").filter(Boolean);

  const variants: string[] = [normalized];

  // Without initials — just the last word (surname/given name)
  if (parts.length > 1) {
    variants.push(parts[parts.length - 1]);
    // Last two words
    variants.push(parts.slice(-2).join(" "));
    // Initials concatenated + last name: "kasr raju"
    const initials = parts
      .slice(0, -1)
      .map((p) => p[0])
      .join("");
    variants.push(`${initials} ${parts[parts.length - 1]}`);
    // All parts concatenated no space: "kasrraju"
    variants.push(parts.join(""));
  }

  return [...new Set(variants)];
}

// ─── OCR: extract text from image ────────────────────────────────────────────

async function extractTextFromImage(image: File | string): Promise<string> {
  const result = await Tesseract.recognize(image, "eng", {
    logger: () => {}, // silence progress logs
  });

  // Tesseract returns low-confidence chars with spaces/noise — clean up
  let text = result.data.text;

  // Fix common OCR mistakes on ID cards:
  text = text
    .replace(/[|\\]/g, "I")           // | or \ misread as I
    .replace(/0(?=[A-Z])/g, "O")      // 0 before letter → O (e.g. "C0LLEGE" → "COLLEGE")
    .replace(/(?<=[A-Z])0/g, "O")     // same after letter
    .replace(/l(?=\d)/g, "1")         // lowercase l before digit → 1
    .replace(/\n{3,}/g, "\n\n")       // collapse excessive newlines
    .trim();

  return text;
}

// ─── College match ─────────────────────────────────────────────────────────────

function findCollegeInText(text: string, collegeId: string): boolean {
  const lower = text.toLowerCase();
  const aliases = COLLEGE_ALIASES[collegeId] ?? [];

  for (const alias of aliases) {
    // Exact substring match
    if (lower.includes(alias.toLowerCase())) return true;

    // Fuzzy — handle 1-2 OCR character errors
    // e.g. "5agi ramakrishnam" instead of "Sagi ramakrishnam"
    if (alias.length > 6) {
      const fuse = new Fuse([lower], { threshold: 0.3, includeScore: true });
      const result = fuse.search(alias.toLowerCase());
      if (result.length > 0 && (result[0].score ?? 1) < 0.3) return true;
    }
  }

  return false;
}

// ─── Roll number extraction + match ───────────────────────────────────────────

function extractRollNumbers(text: string): string[] {
  const found: string[] = [];
  for (const pattern of ROLL_NUMBER_PATTERNS) {
    const matches = text.toUpperCase().match(pattern) ?? [];
    found.push(...matches.map((m) => m.replace(/\s/g, "")));
  }
  return [...new Set(found)];
}

function rollNumbersMatch(entered: string, extracted: string[]): boolean {
  const clean = entered.toUpperCase().replace(/\s/g, "");
  return extracted.some((r) => r === clean);
}

// ─── Name match ───────────────────────────────────────────────────────────────
// Returns a score 0–1 (1 = perfect match)

function matchName(enteredName: string, ocrText: string): { score: number; matched: string } {
  const enteredVariants = expandAbbreviatedName(enteredName);

  // Extract candidate names from OCR text
  // Names on ID cards are usually ALL CAPS or Title Case on a single line
  const lines = ocrText.split("\n").map((l) => l.trim()).filter((l) => l.length > 2);
  const normalizedLines = lines.map(normalizeName);

  let bestScore = 0;
  let bestMatch = "";

  for (const variant of enteredVariants) {
    // Direct substring match in any line
    for (const line of normalizedLines) {
      if (line.includes(variant)) {
        bestScore = 1;
        bestMatch = line;
        break;
      }
    }
    if (bestScore === 1) break;

    // Fuzzy match across all lines
    const fuse = new Fuse(normalizedLines, {
      threshold: 0.45,
      includeScore: true,
      minMatchCharLength: 3,
    });

    const results = fuse.search(variant);
    if (results.length > 0) {
      const score = 1 - (results[0].score ?? 1);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = results[0].item;
      }
    }
  }

  return { score: bestScore, matched: bestMatch };
}

// ─── Main verification function ───────────────────────────────────────────────

export async function verifyStudentId(input: IdCardInput): Promise<VerificationResult> {
  const { enteredName, enteredRollNumber, enteredCollegeId, imageFile } = input;

  let extractedText = "";

  try {
    extractedText = await extractTextFromImage(imageFile);
  } catch (err) {
    return {
      verified: false,
      confidence: 0,
      failReason: "Could not read the ID card image. Please upload a clearer photo.",
      extractedText: "",
      details: {
        collegeFound: false,
        nameMatched: false,
        rollMatched: false,
        nameScore: 0,
      },
    };
  }

  // 1. College check
  const collegeFound = findCollegeInText(extractedText, enteredCollegeId);

  // 2. Roll number check
  const extractedRolls = extractRollNumbers(extractedText);
  const rollMatched = rollNumbersMatch(enteredRollNumber, extractedRolls);

  // 3. Name check (fuzzy, handles abbreviations)
  const { score: nameScore, matched: extractedName } = matchName(enteredName, extractedText);
  const nameMatched = nameScore >= 0.55; // threshold — tunable

  // 4. Compute overall confidence
  // Weights: roll number most important (40%), college (35%), name (25%)
  const confidence = Math.round(
    (rollMatched ? 40 : 0) +
    (collegeFound ? 35 : 0) +
    nameScore * 25
  );

  // Pass threshold: must have roll + college, name is best-effort
  // (names are hardest to OCR — especially abbreviated Telugu names)
  const verified = rollMatched && collegeFound && confidence >= 60;

  // Build fail reason
  let failReason: string | undefined;
  if (!verified) {
    if (!collegeFound) {
      failReason =
        "College name not found on ID card. Make sure the full card is visible and SRKR is printed on it.";
    } else if (!rollMatched) {
      failReason = `Roll number "${enteredRollNumber}" not found on card. OCR found: ${
        extractedRolls.length > 0 ? extractedRolls.join(", ") : "none"
      }. Check for typos.`;
    } else if (!nameMatched) {
      failReason =
        "Name could not be matched. If your ID uses initials like K.A.S.R.Raju, enter your name exactly as printed on the card.";
    } else {
      failReason = "Verification confidence too low. Please upload a clearer, well-lit photo.";
    }
  }

  return {
    verified,
    confidence,
    failReason,
    extractedText,
    details: {
      collegeFound,
      nameMatched,
      rollMatched,
      nameScore,
      extractedName,
      extractedRoll: extractedRolls[0],
    },
  };
}

// ─── Helper: validate roll number format before even scanning ─────────────────
// Show inline error on the form field instantly

export function validateRollNumberFormat(roll: string): {
  valid: boolean;
  message?: string;
} {
  const clean = roll.toUpperCase().replace(/\s/g, "");

  // Standard AP engineering format
  if (/^[1-2][0-9][A-Z][0-9]{2}[A-Z][0-9]{4}$/.test(clean)) {
    return { valid: true };
  }

  // Older format
  if (/^[1-2][0-9][0-9]{3}[A-Z][0-9]{4}$/.test(clean)) {
    return { valid: true };
  }

  if (clean.length < 8) {
    return { valid: false, message: "Roll number too short" };
  }

  return {
    valid: false,
    message:
      "Format should be like 21B91A0501. Check your ID card.",
  };
}

// ─── Helper: normalize name for display (un-abbreviate if possible) ───────────

export function formatDisplayName(rawName: string): string {
  // Capitalize each part, preserve dots in initials
  return rawName
    .split(/\s+/)
    .map((word) => {
      // If it's initials like "k.a.s.r" → "K.A.S.R"
      if (/^[a-z](\.[a-z])+\.?$/i.test(word)) {
        return word.toUpperCase();
      }
      // Normal word → capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
