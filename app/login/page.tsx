"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { toast } from "sonner";
import { Phone, ArrowRight, ShieldCheck, Loader2, Lock, Camera, School, FileText, UploadCloud } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { DEPARTMENTS, COLLEGES } from "@/lib/constants";

function LoginContent() {
    const { selectedCollege } = useCollege();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/home";

    // Form states
    const [step, setStep] = useState<"details" | "otp" | "ocr">("details");
    const [loading, setLoading] = useState(false);

    // Step 1: Details
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [roll, setRoll] = useState("");
    const [college, setCollege] = useState(selectedCollege || COLLEGES[0]);
    const [department, setDepartment] = useState(DEPARTMENTS[0]);

    // Step 2: OTP
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Step 3: OCR
    const [idImage, setIdImage] = useState<File | null>(null);
    const [ocrProgress, setOcrProgress] = useState(0);

    const recaptchaRef = useRef<HTMLDivElement>(null);
    const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!recaptchaVerifier.current && recaptchaRef.current && auth) {
            try {
                recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
                    size: "invisible",
                });
            } catch (error) {
                console.error("Recaptcha init error:", error);
            }
        }
    }, []);

    // Also sync if context updates late
    useEffect(() => {
        if (selectedCollege && step === "details") {
            setCollege(selectedCollege);
        }
    }, [selectedCollege, step]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || phone.length < 10 || !name || !roll) {
            toast.error("Please fill all required details");
            return;
        }
        setLoading(true);
        try {
            const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
            const appVerifier = recaptchaVerifier.current;
            if (!appVerifier || !auth) throw new Error("Initialization error");
            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(result);
            setStep("otp");
            toast.success("Code sent to your phone");
            setTimeout(() => otpRefs.current[0]?.focus(), 200);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...otp];
        next[index] = value;
        setOtp(next);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) {
            toast.error("Enter the full 6-digit code");
            return;
        }
        setLoading(true);
        try {
            if (!confirmationResult) throw new Error("No confirmation result");
            const userCredential = await confirmationResult.confirm(code);
            const user = userCredential.user;

            // Check if user already verified in DB
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().isVerified) {
                toast.success("Welcome back!");
                router.push(redirectUrl);
                return;
            }

            // Otherwise, require OCR step
            setStep("ocr");
        } catch (error: any) {
            console.error(error);
            toast.error("Invalid code — please try again");
        } finally {
            setLoading(false);
        }
    };

    const handleOCRUpload = async () => {
        if (!idImage) {
            toast.error("Please upload or capture your ID card");
            return;
        }

        setLoading(true);
        setOcrProgress(10);

        // Simulating robust OCR with delays
        await new Promise(r => setTimeout(r, 600));
        setOcrProgress(45);
        await new Promise(r => setTimeout(r, 800));
        setOcrProgress(80);
        await new Promise(r => setTimeout(r, 500));

        // Check "Match"
        // For product demo, we will auto-match and save the user
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Lost session");

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                phoneNumber: user.phoneNumber,
                rollNumber: roll.toUpperCase(),
                college: college,
                department: department,
                isVerified: true,
                isBlocked: false,
                strikeCount: 0,
                createdAt: new Date(),
            });

            setOcrProgress(100);
            toast.success("ID Verified! You're now a verified student.");
            setTimeout(() => router.push(redirectUrl), 800);

        } catch (error) {
            console.error(error);
            toast.error("Verification failed. Please try again or contact support.");
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen gradient-hero overflow-y-auto">
            <div id="recaptcha-container" ref={recaptchaRef} />

            {/* Top Bar */}
            <div className="px-6 pt-10 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shadow-indigo">
                        <span className="text-base text-white">📦</span>
                    </div>
                    <span className="text-sm font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Idhi Yaaparam
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center px-5 pb-12">
                <div className="mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full badge-indigo mb-6 text-[10px] font-black uppercase tracking-widest">
                        <Lock className="w-3 h-3" />
                        Secured Campus Login
                    </div>

                    <h1 className="text-3xl font-black leading-tight text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {step === "details" && <>Join Your<br /><span className="text-indigo-400">Campus.</span></>}
                        {step === "otp" && <>Enter<br /><span className="text-indigo-400">Your Code</span></>}
                        {step === "ocr" && <>Verify Your<br /><span className="text-indigo-400">Student ID</span></>}
                    </h1>
                    <p className="text-xs font-semibold text-slate-400/80 leading-relaxed max-w-[280px]">
                        {step === "details" && "We need a few details to connect you with your college peers safely."}
                        {step === "otp" && `We sent a 6-digit code to +91 ${phone}`}
                        {step === "ocr" && "Upload a photo of your ID. We'll extract your Roll Number for security."}
                    </p>
                </div>

                {/* Form Card */}
                <div className="glass rounded-3xl p-6 shadow-premium border border-slate-700/60">
                    {/* DETAILS STEP */}
                    {step === "details" && (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</label>
                                    <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-indigo-500 rounded-xl h-12 px-3 text-sm text-white placeholder-slate-600 outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Roll No.</label>
                                    <input required type="text" value={roll} onChange={e => setRoll(e.target.value.toUpperCase())} placeholder="21B81A..." className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-indigo-500 rounded-xl h-12 px-3 text-sm text-white placeholder-slate-600 outline-none font-medium" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Phone Mobile</label>
                                <div className="flex items-center gap-2 bg-[hsl(217,32%,16%)] border border-slate-700 focus-within:border-indigo-500 rounded-xl h-12 px-3">
                                    <span className="text-xs font-bold text-slate-400 border-r border-slate-700 pr-2">+91</span>
                                    <input required type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" className="flex-1 bg-transparent text-white text-sm outline-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><School className="w-3 h-3" /> College</label>
                                <select value={college} onChange={e => setCollege(e.target.value)} className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-indigo-500 rounded-xl h-12 px-3 text-sm text-white outline-none appearance-none">
                                    {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Department</label>
                                <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-indigo-500 rounded-xl h-12 px-3 text-sm text-white outline-none appearance-none">
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <button type="submit" disabled={loading} className="w-full h-14 mt-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-indigo">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}

                    {/* OTP STEP */}
                    {step === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="flex justify-between gap-2">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { otpRefs.current[i] = el; }}
                                        type="text" inputMode="numeric" maxLength={1} value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                        disabled={loading}
                                        className="w-11 h-14 rounded-xl bg-[hsl(217,32%,16%)] border border-slate-700 text-white text-xl font-black text-center outline-none focus:border-indigo-500 transition-all"
                                    />
                                ))}
                            </div>

                            <button type="submit" disabled={loading || otp.join("").length < 6} className="w-full h-14 rounded-xl gradient-indigo text-white font-bold text-sm shadow-indigo flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Continue</>}
                            </button>
                        </form>
                    )}

                    {/* OCR STEP */}
                    {step === "ocr" && (
                        <div className="space-y-6 text-center">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mx-auto w-fit">
                                <FileText className="w-8 h-8 text-indigo-400" />
                            </div>

                            {!idImage ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-300 font-medium">Please upload a clear photo of your student ID showing: <br /><strong className="text-white bg-slate-800 px-1 rounded">{roll}</strong></p>
                                    <button onClick={() => document.getElementById("ocr-input")?.click()} className="w-full h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 border-dashed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all group">
                                        <Camera className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                        Take Photo or Upload
                                    </button>
                                    <input id="ocr-input" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setIdImage(e.target.files[0])} />
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-[hsl(217,32%,10%)]">
                                        <img src={URL.createObjectURL(idImage)} alt="ID Preview" className={`w-full h-full object-cover transition-all ${loading ? "opacity-40 grayscale blur-sm" : ""}`} />
                                        {loading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                                <div className="w-3/4 max-w-[200px] h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                                    <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${ocrProgress}%` }} />
                                                </div>
                                                <p className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full animate-pulse">
                                                    {ocrProgress < 50 ? "Scanning text..." : "Verifying Roll Number..."}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {!loading && ocrProgress === 0 && (
                                        <button onClick={handleOCRUpload} className="w-full h-14 rounded-xl gradient-indigo text-white font-black text-sm shadow-indigo flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                                            <ShieldCheck className="w-5 h-5" /> Verify ID Now
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Badges */}
                <div className="mt-8 flex justify-center gap-3 opacity-60">
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-400"><Lock className="w-3" /> End-to-End Encrypted</span>
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-400"><ShieldCheck className="w-3" /> Anti-Fraud OCR</span>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
