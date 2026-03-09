"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signInAnonymously } from "firebase/auth";
import { toast } from "sonner";
import { Phone, ArrowRight, ShieldCheck, Loader2, Lock, Camera, School, FileText, UploadCloud } from "lucide-react";
import Tesseract from "tesseract.js";
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
    const [college, setCollege] = useState<string>(selectedCollege?.name || COLLEGES[0].name);
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
            setCollege(selectedCollege.name);
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
            const rawPhone = phone.replace(/\D/g, "");
            if (rawPhone === "9876543210" || rawPhone === "0123456789") {
                setStep("otp");
                toast.success("Mock Code sent to your phone");
                setTimeout(() => otpRefs.current[0]?.focus(), 200);
                return;
            }

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
            if (!db) throw new Error("Firestore not initialized"); // db check
            const rawPhone = phone.replace(/\D/g, "");
            let user;

            if (rawPhone === "9876543210" || rawPhone === "0123456789") {
                const expectedOtp = rawPhone === "9876543210" ? "654321" : "123456";
                if (code !== expectedOtp) {
                    toast.error("Invalid mock code");
                    setLoading(false);
                    return;
                }
                const userCredential = await signInAnonymously(auth!);
                user = userCredential.user;
            } else {
                if (!confirmationResult) throw new Error("No confirmation result");
                const userCredential = await confirmationResult.confirm(code);
                user = userCredential.user;
            }

            // Check if user already verified in DB
            const userDoc = await getDoc(doc(db!, "users", user.uid));
            if (userDoc.exists() && userDoc.data().isVerified) {
                toast.success("Welcome back!");
                router.push(redirectUrl);
                return;
            }

            // MOCK BYPASS: Auto create DB record and redirect to skip OCR
            if (rawPhone === "9876543210" || rawPhone === "0123456789") {
                await setDoc(doc(db!, "users", user.uid), {
                    uid: user.uid,
                    name: name,
                    phoneNumber: "+91" + rawPhone,
                    rollNumber: roll.toUpperCase(),
                    college: college,
                    department: department,
                    isVerified: true,
                    isBlocked: false,
                    strikeCount: 0,
                    createdAt: new Date(),
                });
                toast.success("Mock User Verified!");
                setTimeout(() => router.push(redirectUrl), 800);
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
        toast.info("Scanning ID Card...");

        try {
            // Run real OCR using Tesseract.js
            const { data: { text } } = await Tesseract.recognize(
                idImage,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setOcrProgress(10 + Math.floor(m.progress * 80));
                        }
                    }
                }
            );

            console.log("Extracted Text:", text);
            const extractedText = text.replace(/\s+/g, '').toUpperCase();

            // Check Roll Match
            const targetRoll = roll.replace(/\s+/g, '').toUpperCase();
            const rollMatch = extractedText.includes(targetRoll);

            // Check College Match (Full name or Acronym)
            const collegeUpper = college.replace(/\s+/g, '').toUpperCase();
            const collegeAcronym = college.split(/[\s-]+/).map(w => w[0]).join('').toUpperCase();
            const collegeMatch = extractedText.includes(collegeUpper) || extractedText.includes(collegeAcronym);

            if (!rollMatch || !collegeMatch) {
                throw new Error("We couldn't verify your ID. Please upload a clearer photo or try again.");
            }

            const user = auth?.currentUser;
            if (!user) throw new Error("Lost session");
            if (!db) throw new Error("Firestore not initialized");

            await setDoc(doc(db!, "users", user.uid), {
                uid: user.uid,
                name: name,
                phoneNumber: user.phoneNumber || "+91" + phone.replace(/\D/g, ""),
                rollNumber: roll.toUpperCase(),
                college: college,
                department: department,
                isVerified: true,
                isBlocked: false,
                strikeCount: 0,
                createdAt: new Date(),
            });

            setOcrProgress(100);
            toast.success("ID Verified! Welcome to the network.");
            setTimeout(() => router.push(redirectUrl), 800);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Verification failed. Please try a clearer photo.");
            setLoading(false);
            setOcrProgress(0);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative overflow-y-auto">
            {/* Ambient Background Blobs matching reference image */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "0s" }} />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-pink-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-purple-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "4s" }} />
            <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-cyan-200/20 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "1s" }} />

            <div id="recaptcha-container" ref={recaptchaRef} className="relative z-10" />

            {/* Top Bar */}
            <div className="px-6 pt-10 pb-4 shrink-0 relative z-10">
                <div className="flex items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shadow-indigo">
                        <span className="text-xl text-white">🚀</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center px-6 pb-12 relative z-10 max-w-md mx-auto w-full">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/80 border border-indigo-100 shadow-sm mb-6 text-[11px] font-black uppercase tracking-widest text-indigo-600 backdrop-blur-md">
                        <School className="w-3.5 h-3.5" />
                        Student Friendly App
                    </div>

                    <h1 className="text-4xl font-black leading-tight text-slate-800 mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {step === "details" && <>Join Your<br /><span className="text-indigo-600">Campus.</span></>}
                        {step === "otp" && <>Enter<br /><span className="text-indigo-600">Your Code</span></>}
                        {step === "ocr" && <>Verify Your<br /><span className="text-indigo-600">Student ID</span></>}
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 leading-relaxed mx-auto max-w-[280px]">
                        {step === "details" && "We need a few details to connect you with your college peers."}
                        {step === "otp" && `We sent a 6-digit code to +91 ${phone}`}
                        {step === "ocr" && "Upload a photo of your ID to keep our campus community verified."}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(110,115,200,0.2)] border border-white">
                    {/* DETAILS STEP */}
                    {step === "details" && (
                        <form onSubmit={handleSendOtp} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Name</label>
                                    <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full bg-white/50 border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-800 placeholder-slate-400 outline-none transition-all font-medium shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Roll No.</label>
                                    <input required type="text" value={roll} onChange={e => setRoll(e.target.value.toUpperCase())} placeholder="21B81A..." className="w-full bg-white/50 border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-800 placeholder-slate-400 outline-none font-bold transition-all shadow-inner uppercase" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Phone Mobile</label>
                                <div className="flex items-center gap-3 bg-white/50 border border-indigo-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 rounded-2xl h-14 px-4 transition-all shadow-inner">
                                    <span className="text-sm font-black text-indigo-400 border-r border-indigo-100 pr-3">+91</span>
                                    <input required type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" className="flex-1 bg-transparent text-slate-800 text-base font-bold outline-none placeholder-slate-400 tracking-wide" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 pl-1"><School className="w-3.5 h-3.5" /> College</label>
                                <select value={college} onChange={e => setCollege(e.target.value)} className="w-full bg-white/50 border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-sm font-bold text-slate-700 outline-none appearance-none transition-all shadow-inner">
                                    {COLLEGES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-1">Department</label>
                                <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-white/50 border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-sm font-bold text-slate-700 outline-none appearance-none transition-all shadow-inner">
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <button type="submit" disabled={loading} className="w-full h-14 mt-6 rounded-2xl gradient-indigo active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-indigo hover:shadow-lg hover:-translate-y-0.5">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        </form>
                    )}

                    {/* OTP STEP */}
                    {step === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-8">
                            <div className="flex justify-between gap-2 sm:gap-3">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { otpRefs.current[i] = el; }}
                                        type="text" inputMode="numeric" maxLength={1} value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                        disabled={loading}
                                        className="w-full aspect-[3/4] rounded-2xl bg-white/50 border border-indigo-100 text-slate-800 text-2xl font-black text-center outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                                    />
                                ))}
                            </div>

                            <button type="submit" disabled={loading || otp.join("").length < 6} className="w-full h-14 rounded-2xl gradient-indigo text-white font-bold text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] hover:-translate-y-0.5 transition-all">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Verify & Continue</>}
                            </button>
                        </form>
                    )}

                    {/* OCR STEP */}
                    {step === "ocr" && (
                        <div className="space-y-8 text-center">
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mx-auto w-fit shadow-inner">
                                <FileText className="w-10 h-10 text-indigo-500" />
                            </div>

                            {!idImage ? (
                                <div className="space-y-5">
                                    <p className="text-sm text-slate-600 font-medium">Please upload a clear photo of your student ID showing: <br /><strong className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-lg mt-1 inline-block border border-indigo-100">{roll}</strong></p>
                                    <button onClick={() => document.getElementById("ocr-input")?.click()} className="w-full h-16 rounded-2xl bg-slate-50 hover:bg-white border-2 border-indigo-100 border-dashed text-indigo-600 font-bold text-sm flex items-center justify-center gap-3 transition-all group shadow-sm">
                                        <Camera className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 group-hover:scale-110 transition-transform" />
                                        Take Photo or Upload
                                    </button>
                                    <input id="ocr-input" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setIdImage(e.target.files[0])} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-indigo-100 bg-slate-50 shadow-sm">
                                        <img src={URL.createObjectURL(idImage)} alt="ID Preview" className={`w-full h-full object-cover transition-all ${loading ? "opacity-30 grayscale blur-md scale-105" : ""}`} />
                                        {loading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-sm">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin relative z-10" />
                                                </div>
                                                <div className="w-2/3 max-w-[200px] h-2.5 bg-indigo-100 rounded-full overflow-hidden border border-white shadow-inner">
                                                    <div className="h-full bg-indigo-500 transition-all duration-300 ease-out relative" style={{ width: `${ocrProgress}%` }}>
                                                        <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 translate-x-full animate-[shimmer_1s_infinite]" />
                                                    </div>
                                                </div>
                                                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-white/80 px-4 py-1.5 rounded-full shadow-sm border border-indigo-50 animate-pulse">
                                                    {ocrProgress < 50 ? "Scanning text..." : "Verifying Roll Number..."}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {!loading && ocrProgress === 0 && (
                                        <button onClick={handleOCRUpload} className="w-full h-14 rounded-2xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 active:scale-[0.98] hover:-translate-y-0.5 transition-all">
                                            <ShieldCheck className="w-5 h-5" /> Verify ID Now
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Badges */}
                <div className="mt-10 flex justify-center gap-4 opacity-80">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                        <School className="w-3.5 h-3.5" /> 100% Student Focus
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        <ShieldCheck className="w-3.5 h-3.5" /> Campus Verified
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-indigo-600"><Loader2 className="w-10 h-10 animate-spin mb-4" /><p className="font-bold font-outfit text-xl">Loading Auth...</p></div>}>
            <LoginContent />
        </Suspense>
    );
}
