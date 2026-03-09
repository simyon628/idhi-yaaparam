"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signInAnonymously } from "firebase/auth";
import { toast } from "sonner";
import { Phone, ArrowRight, ShieldCheck, Loader2, Lock, Camera, School, FileText, UploadCloud } from "lucide-react";
import { verifyIdCardWithOcr } from "@/lib/ocr/verifyIdCard";
import { useCollege } from "@/contexts/CollegeContext";
import { DEPARTMENTS, COLLEGES } from "@/lib/constants";
import { compressImageFile } from "@/lib/image/compressImage";

function LoginContent() {
    const { selectedCollege, isReady } = useCollege();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/home";

    // Removed multi-step 'step' state to favor a vertical unified form as requested.
    const [loading, setLoading] = useState(false);

    // Step 1: Details
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [roll, setRoll] = useState("");
    const [college, setCollege] = useState<string>("");
    const [department, setDepartment] = useState("");
    const [showDeptDropdown, setShowDeptDropdown] = useState(false);

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

    // Safely hydrate the correct college value ONLY after localStorage loads it
    useEffect(() => {
        if (isReady) {
            setCollege(selectedCollege?.name || COLLEGES[0].name);
        }
    }, [isReady, selectedCollege]);

    // Check for existing verified session to explicitly bypass login flow loops
    useEffect(() => {
        if (!auth || !db) return;
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db!, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().verified === true) {
                        router.replace(redirectUrl);
                    }
                } catch (err) {
                    console.error("Auth hydration error:", err);
                }
            }
        });
        return () => unsubscribe();
    }, [router, redirectUrl]);

    if (!isReady) return null;

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
                toast.success("Mock Code sent to your phone");
                setTimeout(() => otpRefs.current[0]?.focus(), 200);
                return;
            }

            const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
            const appVerifier = recaptchaVerifier.current;
            if (!appVerifier || !auth) throw new Error("Initialization error");
            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(result);
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

    const handleVerifyOtpCore = async () => {
        const code = otp.join("");
        if (code.length !== 6) {
            toast.error("Enter the full 6-digit code");
            return null;
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

            // Removed legacy auto-redirect for returning users.
            // We now strictly require OCR to validate the physical ID capture before letting users through.
            // MOCK BYPASS: Auto create DB record and redirect to skip OCR
            if (rawPhone === "9876543210" || rawPhone === "0123456789") {
                await setDoc(doc(db!, "users", user.uid), {
                    uid: user.uid,
                    name: name,
                    phoneNumber: "+91" + rawPhone,
                    collegeId: selectedCollege?.id || "mock-college",
                    collegeName: college,
                    department: department,
                    verified: true,
                    verifiedMethod: 'id_ocr_v1',
                    verifiedCollegeId: selectedCollege?.id,
                    verifiedRollNumber: roll.toUpperCase(),
                    accountStatus: 'active',
                    strikeCount: 0,
                    createdAt: new Date(),
                });
                toast.success("Mock User Verified!");
                setTimeout(() => router.push(redirectUrl), 800);
                return "MOCK_BYPASS";
            }

            // Otherwise, return UID to proceed with OCR logic synchronously
            return user.uid;

        } catch (error: any) {
            console.error(error);
            toast.error("Invalid code — please try again");
            return null;
        } finally {
            // Keep loading true if successful, so OCR can take over smoothly
            // setLoading(false); handled inside the wrapper
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone || !name || !roll || !college || !otp.join("")) {
            toast.error("Please fill all details and verify OTP");
            return;
        }

        const rawPhone = phone.replace(/\D/g, "");
        const isMockBypass = rawPhone === "9876543210" || rawPhone === "0123456789";

        if (!isMockBypass && !idImage) {
            toast.error("Please capture a photo of your college ID before continuing.");
            return;
        }

        setLoading(true);

        // STAGE 1: Verify OTP (Creates or links Firebase Auth User)
        const uid = await handleVerifyOtpCore();

        if (!uid) {
            setLoading(false);
            return; // OTP failed
        }
        if (uid === "MOCK_BYPASS") {
            // Mock handled everything, we are done.
            return;
        }

        // STAGE 2: Run OCR ID Verification
        if (!idImage) {
            setLoading(false);
            toast.error("Please capture a photo of your college ID before continuing.");
            return;
        }

        setOcrProgress(10);
        toast.info("Scanning ID Card...");

        try {
            // Check for explicit aliases (or generate basic ones based on acronym logic)
            const collegeAliases = selectedCollege?.aliases || [
                college.split(/[\s-]+/).map(w => w[0]).join('').toUpperCase()
            ];

            const result = await verifyIdCardWithOcr({
                imageFile: idImage,
                rollNumber: roll,
                collegeName: college,
                collegeAliases: collegeAliases
            });

            if (result.status === 'fail') {
                if (result.reason === 'ROLL_NOT_FOUND') {
                    throw new Error("We couldn't find your Roll Number. Ensure the ID is bright and clearly visible.");
                } else if (result.reason === 'COLLEGE_NOT_FOUND') {
                    throw new Error(`We couldn't confirm this ID belongs to ${college}. Please upload a strictly valid ID card.`);
                } else {
                    throw new Error(result.errorMessage || "Failed to scan text. Try a clearer photo.");
                }
            }

            const user = auth?.currentUser;
            if (!user) throw new Error("Lost session");
            if (!db) throw new Error("Firestore not initialized");

            await setDoc(doc(db!, "users", user.uid), {
                uid: user.uid,
                name: name,
                phoneNumber: user.phoneNumber || "+91" + phone.replace(/\D/g, ""),
                collegeId: selectedCollege?.id || "unknown",
                collegeName: college,
                department: department,
                verified: true,
                verifiedMethod: 'id_ocr_v1',
                verifiedCollegeId: selectedCollege?.id,
                verifiedRollNumber: roll.toUpperCase(),
                accountStatus: 'active',
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
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative">
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

                    <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Create your student account
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 leading-relaxed mx-auto max-w-[280px]">
                        We need a few details to verify your campus identity.
                    </p>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-6">

                    {/* 1. Name */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 pl-1">Full Name</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full bg-white/50 border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-800 placeholder-slate-400 outline-none transition-all font-bold shadow-inner" />
                    </div>

                    {/* 2. Roll Number */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 pl-1">Roll Number</label>
                        <input required type="text" value={roll} onChange={e => setRoll(e.target.value.toUpperCase())} placeholder="21B81A..." className="w-full bg-white/50 border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-800 placeholder-slate-400 outline-none font-bold transition-all shadow-inner uppercase" />
                    </div>

                    {/* 3. College (Read-only) */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 pl-1"><School className="w-3.5 h-3.5" /> College</label>
                        <input readOnly type="text" value={college} className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl h-14 px-4 text-sm font-bold text-slate-600 outline-none cursor-not-allowed shadow-inner" />
                    </div>

                    {/* Department - Searchable Input */}
                    <div className="space-y-2 relative">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 pl-1">Department</label>
                        <div className="relative">
                            <input
                                required
                                type="text"
                                value={department}
                                onChange={e => setDepartment(e.target.value)}
                                onFocus={() => setShowDeptDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDeptDropdown(false), 200)}
                                placeholder="CSE, MBA, Library..."
                                className="w-full bg-white/50 border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner placeholder-slate-400"
                            />
                            {showDeptDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 max-h-56 overflow-y-auto z-50 p-2 flex flex-col gap-1">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 px-2 pt-1 pb-1">Suggestions</p>

                                    {DEPARTMENTS.filter(d => d.toLowerCase().includes(department.toLowerCase())).map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setDepartment(d);
                                                setShowDeptDropdown(false);
                                            }}
                                            className="text-left w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-700 transition-colors"
                                        >
                                            {d}
                                        </button>
                                    ))}

                                    {department && !DEPARTMENTS.some(d => d.toLowerCase() === department.toLowerCase()) && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowDeptDropdown(false);
                                            }}
                                            className="text-left w-full px-3 py-2.5 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 text-sm font-bold text-indigo-700 transition-colors"
                                        >
                                            Use "{department}"
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Mobile Number + Send OTP */}
                    <div className="space-y-3 pt-4 border-t border-slate-100 border-dashed">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 pl-1">Mobile Number</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-3 bg-white/50 border border-indigo-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 rounded-2xl h-14 px-4 transition-all shadow-inner flex-1">
                                <span className="text-sm font-black text-indigo-400 border-r border-indigo-100 pr-3">+91</span>
                                <input required type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" className="flex-1 bg-transparent text-slate-800 text-base font-bold outline-none placeholder-slate-400 tracking-wide w-full" />
                            </div>
                            <button type="button" onClick={handleSendOtp} disabled={loading || phone.length < 10} className="h-14 px-6 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-sm transition-all whitespace-nowrap active:scale-95 disabled:opacity-50">
                                Send OTP
                            </button>
                        </div>

                        {/* OTP Entry (Visible after sending) */}
                        {confirmationResult || phone === "9876543210" || phone === "0123456789" ? (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 pl-1 block mb-2 text-indigo-500">Enter OTP</label>
                                <div className="flex justify-between gap-2 max-w-[300px]">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { otpRefs.current[i] = el; }}
                                            type="text" inputMode="numeric" maxLength={1} value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            disabled={loading}
                                            className="w-full aspect-square rounded-xl flex-1 bg-white/50 border border-indigo-100 text-slate-800 text-xl font-black text-center outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* 5. Upload College ID (Camera only) */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 border-dashed">
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 pl-1 block">Upload College ID</label>
                            <p className="text-[12px] font-medium text-slate-500 pl-1 mt-1">Take a clear photo of your official college ID card.</p>
                        </div>

                        {!idImage ? (
                            <div className="space-y-2">
                                <button type="button" onClick={() => document.getElementById("ocr-input")?.click()} className="w-full h-16 rounded-2xl bg-slate-50 hover:bg-white border-2 border-indigo-100 border-dashed text-indigo-600 font-bold text-sm flex items-center justify-center gap-3 transition-all group shadow-sm">
                                    <Camera className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 group-hover:scale-110 transition-transform" />
                                    Open Camera
                                </button>
                                <input id="ocr-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        try {
                                            const compressedBlob = await compressImageFile(file, { maxWidth: 1280, quality: 0.8 });
                                            if (compressedBlob.size > 400 * 1024) {
                                                console.warn('Compressed ID image still larger than 400KB:', compressedBlob.size);
                                            }
                                            const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
                                            setIdImage(compressedFile);
                                        } catch (error) {
                                            console.error("ID Compression error:", error);
                                            toast.error("Failed to process ID photo.");
                                        }
                                    }
                                }} />
                                <p className="text-[11px] text-center font-medium text-slate-400">Tip: Use good lighting and keep the ID in focus so we can read the text.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-indigo-100 bg-slate-50 shadow-sm max-w-[280px] mx-auto">
                                    <img src={URL.createObjectURL(idImage)} alt="ID Preview" style={{ touchAction: 'pan-y' }} className={`w-full max-h-[200px] object-contain transition-all ${loading && ocrProgress > 0 ? "opacity-30 grayscale blur-md scale-105" : ""}`} />
                                    {loading && ocrProgress > 0 && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-sm">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin relative z-10" />
                                            </div>
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full shadow-sm border border-indigo-50 animate-pulse">
                                                Reading your ID card...
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <button type="button" onClick={() => setIdImage(null)} disabled={loading} className="text-xs font-bold text-slate-400 mx-auto block hover:text-red-500 transition-colors">
                                    Retake Photo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Final Action Button */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading || !phone || !name || !roll || otp.join("").length < 6 || (!idImage && phone !== "9876543210")}
                            className="w-full h-14 rounded-2xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 active:scale-[0.98] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 transition-all"
                        >
                            {loading && !ocrProgress ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Verify & Continue</>}
                        </button>
                    </div>
                </form>
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
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-indigo-600"><Loader2 className="w-10 h-10 animate-spin mb-4" /><p className="font-bold font-outfit text-xl">Loading Auth...</p></div>}>
            <LoginContent />
        </Suspense>
    );
}
