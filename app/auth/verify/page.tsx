"use client";

// app/auth/verify/IdVerifyClient.tsx
// Drop this into your existing /auth/verify page

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  verifyStudentId,
  validateRollNumberFormat,
  formatDisplayName,
  type VerificationResult,
} from "@/lib/idVerification";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "form" | "scanning" | "result";

// ─── Confidence bar color ──────────────────────────────────────────────────────

function confidenceColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function IdVerifyClient() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  useEffect(() => {
    if (auth) {
      return onAuthStateChanged(auth as any, (u) => {
        setUser(u as FirebaseUser);
        if (u?.displayName) setEnteredName(u.displayName);
      });
    }
  }, []);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [enteredName, setEnteredName] = useState(user?.displayName ?? "");
  const [rollNumber, setRollNumber] = useState("");
  const [rollError, setRollError] = useState<string | null>(null);

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Image pick ─────────────────────────────────────────────────────────────
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Roll number live validation ────────────────────────────────────────────
  function handleRollChange(val: string) {
    setRollNumber(val);
    if (val.length >= 8) {
      const { valid, message } = validateRollNumberFormat(val);
      setRollError(valid ? null : (message ?? null));
    } else {
      setRollError(null);
    }
  }

  // ── Scan ───────────────────────────────────────────────────────────────────
  async function handleScan() {
    if (!imageFile || !user) return;

    setStep("scanning");

    const verResult = await verifyStudentId({
      enteredName,
      enteredRollNumber: rollNumber,
      enteredCollegeId: "mock-college-srkr", // from user's college selection
      imageFile,
    });

    setResult(verResult);
    setStep("result");
  }

  // ── Save verification to Firestore ────────────────────────────────────────
  async function handleAccept() {
    if (!user || !result) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isVerified: result.verified,
        rollNumber: rollNumber.toUpperCase().replace(/\s/g, ""),
        // Store formatted display name
        fullName: formatDisplayName(enteredName),
        verifiedAt: new Date().toISOString(),
        verificationConfidence: result.confidence,
      });
      router.push("/home");
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  // ── Retry ─────────────────────────────────────────────────────────────────
  function handleRetry() {
    setResult(null);
    setStep("form");
    setImagePreview(null);
    setImageFile(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: "var(--color-background-primary)",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "24px",
    marginBottom: "16px",
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px", color: "var(--color-text-primary)" }}>
        Verify your college ID
      </h1>
      <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "24px" }}>
        Only SRKR students can list or rent items. We scan your ID card to confirm.
      </p>

      {/* ── FORM STEP ── */}
      {step === "form" && (
        <>
          <div style={card}>
            {/* Name field */}
            <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>
              Your name (exactly as on ID card)
            </label>
            <input
              value={enteredName}
              onChange={(e) => setEnteredName(e.target.value)}
              placeholder="e.g. K.A.S.R.Raju or Sai Kumar"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            />

            {/* Roll number field */}
            <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>
              Roll number
            </label>
            <input
              value={rollNumber}
              onChange={(e) => handleRollChange(e.target.value)}
              placeholder="e.g. 21B91A0501"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                fontFamily: "var(--font-mono)",
                border: `1px solid ${rollError ? "var(--color-border-danger)" : "var(--color-border-secondary)"}`,
                borderRadius: "var(--border-radius-md)",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
                boxSizing: "border-box",
              }}
            />
            {rollError && (
              <p style={{ fontSize: "12px", color: "var(--color-text-danger)", marginTop: "4px" }}>
                {rollError}
              </p>
            )}
            <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "6px" }}>
              10-character code from your ID card, e.g. 21B91A0501
            </p>
          </div>

          {/* Image upload */}
          <div style={card}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "12px" }}>
              Photo of your college ID card
            </p>

            {imagePreview ? (
              <div style={{ position: "relative" }}>
                <img
                  src={imagePreview}
                  alt="ID card preview"
                  style={{ width: "100%", borderRadius: "8px", maxHeight: "220px", objectFit: "cover" }}
                />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  padding: "32px",
                  border: "2px dashed var(--color-border-secondary)",
                  borderRadius: "var(--border-radius-md)",
                  background: "var(--color-background-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--color-text-secondary)",
                }}
              >
                <Camera size={28} />
                <span style={{ fontSize: "13px" }}>Tap to upload or take a photo</span>
                <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                  Make sure all text is clearly visible
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Tips */}
          <div style={{ ...card, background: "var(--color-background-info)" }}>
            <p style={{ fontSize: "12px", color: "var(--color-text-info)", fontWeight: 500, marginBottom: "6px" }}>
              Tips for a successful scan
            </p>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: "1.8" }}>
              <li>Place card on a dark flat surface</li>
              <li>Use good lighting — avoid reflections</li>
              <li>Capture the full card, not cropped</li>
              <li>Both sides may have the roll number — use the front</li>
            </ul>
          </div>

          <button
            onClick={handleScan}
            disabled={!imageFile || !enteredName || !rollNumber || !!rollError}
            style={{
              width: "100%",
              padding: "14px",
              background: (!imageFile || !enteredName || !rollNumber || !!rollError)
                ? "var(--color-background-tertiary)"
                : "#1a73e8",
              color: (!imageFile || !enteredName || !rollNumber || !!rollError)
                ? "var(--color-text-tertiary)"
                : "#fff",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              fontSize: "15px",
              fontWeight: 600,
              cursor: (!imageFile || !enteredName || !rollNumber || !!rollError) ? "not-allowed" : "pointer",
            }}
          >
            Verify my ID
          </button>
        </>
      )}

      {/* ── SCANNING STEP ── */}
      {step === "scanning" && (
        <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
          <Loader size={36} style={{ animation: "spin 1s linear infinite", color: "#1a73e8", marginBottom: "16px" }} />
          <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)" }}>
            Scanning your ID card...
          </p>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
            Reading college name, roll number and student name
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── RESULT STEP ── */}
      {step === "result" && result && (
        <>
          {/* Overall verdict */}
          <div style={{
            ...card,
            borderColor: result.verified ? "var(--color-border-success)" : "var(--color-border-danger)",
            background: result.verified ? "var(--color-background-success)" : "var(--color-background-danger)",
            textAlign: "center",
          }}>
            {result.verified
              ? <CheckCircle size={40} style={{ color: "var(--color-text-success)", marginBottom: "8px" }} />
              : <XCircle size={40} style={{ color: "var(--color-text-danger)", marginBottom: "8px" }} />
            }
            <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>
              {result.verified ? "ID Verified!" : "Verification failed"}
            </p>
            {result.failReason && (
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                {result.failReason}
              </p>
            )}
          </div>

          {/* Confidence bar */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Confidence</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: confidenceColor(result.confidence) }}>
                {result.confidence}%
              </span>
            </div>
            <div style={{ height: "8px", background: "var(--color-background-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${result.confidence}%`,
                background: confidenceColor(result.confidence),
                borderRadius: "4px",
                transition: "width 0.6s ease",
              }} />
            </div>

            {/* Breakdown */}
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "College name (SRKR)", ok: result.details.collegeFound },
                { label: `Roll number (${result.details.extractedRoll ?? "not found"})`, ok: result.details.rollMatched },
                {
                  label: `Student name${result.details.extractedName ? ` — "${result.details.extractedName}"` : ""}`,
                  ok: result.details.nameMatched,
                  partial: result.details.nameScore > 0.3 && !result.details.nameMatched,
                },
              ].map(({ label, ok, partial }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {ok
                    ? <CheckCircle size={16} style={{ color: "var(--color-text-success)", flexShrink: 0 }} />
                    : partial
                    ? <AlertCircle size={16} style={{ color: "var(--color-text-warning)", flexShrink: 0 }} />
                    : <XCircle size={16} style={{ color: "var(--color-text-danger)", flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {result.verified ? (
            <button
              onClick={handleAccept}
              disabled={saving}
              style={{
                width: "100%",
                padding: "14px",
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: "var(--border-radius-md)",
                fontSize: "15px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                marginBottom: "12px",
              }}
            >
              {saving ? "Saving..." : "Continue to app"}
            </button>
          ) : (
            <button
              onClick={handleRetry}
              style={{
                width: "100%",
                padding: "14px",
                background: "#1a73e8",
                color: "#fff",
                border: "none",
                borderRadius: "var(--border-radius-md)",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              Try again with a clearer photo
            </button>
          )}

          {/* Manual fallback — if OCR keeps failing */}
          {!result.verified && (
            <button
              onClick={() => router.push("/support")}
              style={{
                width: "100%",
                padding: "12px",
                background: "none",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Submit for manual review instead
            </button>
          )}
        </>
      )}
    </div>
  );
}
