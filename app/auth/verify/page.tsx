"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, storage, auth } from "@/lib/firebase";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { verifyID } from "@/lib/ocr";
import { toast } from "sonner";
import { Camera, RefreshCw, Upload, CheckCircle2, ChevronRight, GraduationCap, Loader2, ShieldCheck } from "lucide-react";

const COLLEGES = [
    "JNTU Hyderabad", "Osmania University", "CBIT", "VNR VJIET",
    "Chaitanya Bharathi Institute", "Malla Reddy Engineering",
    "Gokaraju Rangaraju Institute", "MGIT", "CVR College", "Other"
];

const STEPS = [
    { id: "college", label: "College", icon: GraduationCap },
    { id: "roll", label: "Roll No.", icon: ShieldCheck },
    { id: "camera", label: "Scan ID", icon: Camera },
];

export default function VerifyPage() {
    const [college, setCollege] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [step, setStep] = useState<"college" | "roll" | "camera" | "verifying" | "success">("college");
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const currentStepIndex = STEPS.findIndex(s => s.id === step);

    const startCamera = async () => {
        setStep("camera");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            toast.error("Camera access denied. Please allow permissions.");
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext("2d");
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvasRef.current.toDataURL("image/jpeg");
            setImage(dataUrl);
            canvasRef.current.toBlob((blob) => {
                if (blob) setFile(new File([blob], "id_photo.jpg", { type: "image/jpeg" }));
            }, "image/jpeg");
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            setStep("verifying");
            handleVerification(dataUrl);
        }
    };

    const handleCollegeSelect = (c: string) => {
        setCollege(c);
        setStep("roll");
    };

    const handleRollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rollNumber.match(/^[A-Z0-9]{3,}-?\d{3,}$/i)) {
            toast.error("Invalid roll number format. Example: ECE2024-001");
            return;
        }
        setLoading(true);
        try {
            if (!db) throw new Error("Database not initialized");
            const q = query(collection(db, "users"), where("rollNumber", "==", rollNumber));
            const snap = await getDocs(q);
            if (!snap.empty) {
                toast.error("Roll number already registered.");
                return;
            }
            await startCamera();
        } catch {
            toast.error("Error checking roll number.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (capturedImage?: string) => {
        if (!file || !rollNumber) return;
        setLoading(true);
        try {
            const result = await verifyID(rollNumber, file);
            if (result.success) {
                const userId = auth?.currentUser?.uid;
                if (!userId || !storage || !db) throw new Error("Init error");
                const storageRef = ref(storage, `id_verification/${userId}.jpg`);
                await uploadBytes(storageRef, file);
                const photoUrl = await getDownloadURL(storageRef);
                await setDoc(doc(db, "users", userId), {
                    phoneNumber: auth?.currentUser?.phoneNumber,
                    rollNumber,
                    college,
                    isVerified: true,
                    idPhotoUrl: photoUrl,
                    createdAt: new Date(),
                    strikeCount: 0,
                    isBlocked: false,
                }, { merge: true });
                setStep("success");
                toast.success("Identity verified!");
                setTimeout(() => router.push("/home"), 2000);
            }
        } catch (error: any) {
            toast.error(
                error.message === "ROLL_NUMBER_MISMATCH"
                    ? "Roll number doesn't match ID. Retake."
                    : "Could not read ID. Please retake."
            );
            setStep("roll");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen gradient-hero">
            {/* Header */}
            <div className="px-6 pt-10 pb-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shadow-indigo">
                        <span className="text-base">📦</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Identity Verification
                    </span>
                </div>

                {/* Stepper */}
                {(step === "college" || step === "roll" || step === "camera") && (
                    <div className="flex items-center gap-2 mb-8">
                        {STEPS.map((s, i) => {
                            const isActive = s.id === step;
                            const isDone = i < currentStepIndex;
                            return (
                                <div key={s.id} className="flex items-center gap-2 flex-1">
                                    <div className={`flex flex-col items-center gap-1 ${isActive ? "opacity-100" : isDone ? "opacity-80" : "opacity-30"}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? "gradient-indigo text-white shadow-indigo" : isDone ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                                            {isDone ? "✓" : i + 1}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-indigo-400" : "text-slate-600"}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`flex-1 h-px mb-4 transition-all ${isDone ? "bg-emerald-500/50" : "bg-slate-700"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <h1 className="text-3xl font-black text-white leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {step === "college" && "Select Your College"}
                    {step === "roll" && `Welcome,\n${college.split(" ")[0]}!`}
                    {step === "camera" && "Scan Your ID Card"}
                    {step === "verifying" && "Verifying..."}
                    {step === "success" && "You're In! 🎉"}
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                    {step === "college" && "Start by selecting your institution."}
                    {step === "roll" && "Enter your official university roll number."}
                    {step === "camera" && "Position your ID card clearly in the frame."}
                    {step === "verifying" && "Our AI is reading your roll number from the ID."}
                    {step === "success" && "Redirecting to your campus marketplace..."}
                </p>
            </div>

            {/* Step: College */}
            {step === "college" && (
                <div className="flex-1 px-6 pb-10">
                    <div className="grid grid-cols-1 gap-2">
                        {COLLEGES.map((c) => (
                            <button
                                key={c}
                                onClick={() => handleCollegeSelect(c)}
                                className="flex items-center justify-between px-5 py-4 rounded-xl glass border border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-500/5 text-left transition-all active:scale-[0.98] group"
                            >
                                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{c}</span>
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step: Roll Number */}
            {step === "roll" && (
                <div className="flex-1 px-6 pb-10">
                    <div className="glass rounded-2xl p-6 shadow-premium">
                        <form onSubmit={handleRollSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Roll Number
                                </label>
                                <div className="flex items-center gap-3 bg-[hsl(217,32%,16%)] rounded-xl border border-[hsl(217,32%,26%)] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all h-14 px-4">
                                    <input
                                        type="text"
                                        placeholder="ECE2024-001"
                                        className="flex-1 bg-transparent text-white placeholder-slate-600 text-base font-mono uppercase tracking-widest outline-none"
                                        value={rollNumber}
                                        onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                                        disabled={loading}
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-slate-600">Accepted formats: ECE2024-001, CS22B0042, etc.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !rollNumber}
                                className="w-full h-14 rounded-xl gradient-indigo text-white font-bold text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Camera <Camera className="w-4 h-4 ml-1" /></>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Step: Camera */}
            {step === "camera" && (
                <div className="flex-1 flex flex-col items-center justify-between px-6 pb-12">
                    {/* Camera viewfinder */}
                    <div className="w-full relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "3/4" }}>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        {/* Corner markers */}
                        <div className="absolute inset-8 pointer-events-none">
                            {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
                                <div key={i} className={`absolute ${pos} w-8 h-8 border-indigo-500 ${i === 0 ? "border-t-2 border-l-2 rounded-tl-lg" : i === 1 ? "border-t-2 border-r-2 rounded-tr-lg" : i === 2 ? "border-b-2 border-l-2 rounded-bl-lg" : "border-b-2 border-r-2 rounded-br-lg"}`} />
                            ))}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest text-center">Align your ID here</p>
                            </div>
                        </div>
                    </div>

                    {/* Shutter */}
                    <div className="flex flex-col items-center gap-4 pt-6">
                        <button
                            onClick={capturePhoto}
                            className="w-20 h-20 rounded-full border-4 border-indigo-500 flex items-center justify-center bg-[hsl(222,47%,9%)] shadow-indigo active:scale-95 transition-all"
                        >
                            <div className="w-14 h-14 rounded-full gradient-indigo flex items-center justify-center">
                                <Camera className="text-white w-7 h-7" />
                            </div>
                        </button>
                        <p className="text-slate-500 text-xs font-medium">Tap to capture your Student ID</p>
                    </div>
                </div>
            )}

            {/* Step: Verifying */}
            {step === "verifying" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border border-indigo-500/20 flex items-center justify-center pulse-ring">
                            <div className="w-20 h-20 rounded-full gradient-indigo flex items-center justify-center shadow-indigo">
                                <RefreshCw className="w-9 h-9 text-white animate-spin" />
                            </div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-7 h-7 gradient-amber rounded-full flex items-center justify-center">
                            <Upload className="w-3.5 h-3.5 text-amber-900" />
                        </div>
                    </div>
                    <div className="space-y-1.5 text-center">
                        <p className="text-slate-500 text-sm">AI is extracting your roll number...</p>
                        <div className="flex items-center justify-center gap-1">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Step: Success */}
            {step === "success" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Verification Complete</h2>
                        <p className="text-slate-500 text-sm">Welcome to the campus network, <span className="text-emerald-400 font-bold">{rollNumber}</span>!</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full badge-trust text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Identity Verified
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
