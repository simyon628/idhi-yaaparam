"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { verifyID } from "@/lib/ocr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, RefreshCw, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function VerifyPage() {
    const [rollNumber, setRollNumber] = useState("");
    const [step, setStep] = useState<"roll" | "camera" | "verifying" | "success">("roll");
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        setStep("camera");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            toast.error("Could not access camera. Please allow permissions.");
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

            // Convert to file
            canvasRef.current.toBlob((blob) => {
                if (blob) {
                    const capturedFile = new File([blob], "id_photo.jpg", { type: "image/jpeg" });
                    setFile(capturedFile);
                }
            }, "image/jpeg");

            // Stop camera
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setStep("verifying");
            handleVerification();
        }
    };

    const handleRollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rollNumber.match(/^[A-Z]{3}\d{4}-\d{3}$/)) {
            toast.error("Invalid Roll Number format. Use ECE2024-001 style.");
            return;
        }

        setLoading(true);
        try {
            // Check for uniqueness
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("rollNumber", "==", rollNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                toast.error("This Roll Number is already registered.");
                return;
            }

            await startCamera();
        } catch (error) {
            console.error(error);
            toast.error("Error checking roll number.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async () => {
        if (!file || !rollNumber) return;

        setLoading(true);
        try {
            // OCR Verification
            const result = await verifyID(rollNumber, file);

            if (result.success) {
                // Upload to Storage
                const userId = auth.currentUser?.uid;
                if (!userId) throw new Error("Not authenticated");

                const storageRef = ref(storage, `id_verification/${userId}.jpg`);
                await uploadBytes(storageRef, file);
                const photoUrl = await getDownloadURL(storageRef);

                // Update User Doc
                await setDoc(doc(db, "users", userId), {
                    phoneNumber: auth.currentUser?.phoneNumber,
                    rollNumber: rollNumber,
                    isVerified: true,
                    idPhotoUrl: photoUrl,
                    createdAt: new Date(),
                    reportsCount: 0,
                    isBlocked: false
                }, { merge: true });

                setStep("success");
                toast.success("Identity Verified Successfully!");
                setTimeout(() => router.push("/home"), 2000);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message === "ROLL_NUMBER_MISMATCH"
                ? "Roll number on ID does not match. Please retake photo."
                : "Failed to read ID. Please ensure clarity and retake.");
            setStep("roll");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-6 h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 leading-tight">Identity Verification</h1>
                <p className="text-zinc-500 mt-2">Required to ensure a secure campus community.</p>
            </div>

            {step === "roll" && (
                <Card className="border-none shadow-sm shadow-zinc-100 bg-zinc-50/50 rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-xl">Student Details</CardTitle>
                        <CardDescription>Enter your official university roll number.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRollSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="roll">Roll Number</Label>
                                <Input
                                    id="roll"
                                    placeholder="ECE2024-001"
                                    className="h-14 bg-white border-zinc-200 rounded-2xl text-lg font-mono tracking-wider focus:ring-primary uppercase"
                                    value={rollNumber}
                                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                                    disabled={loading}
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : "Continue to Camera"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {step === "camera" && (
                <div className="flex-1 flex flex-col items-center justify-between">
                    <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden bg-black relative border-4 border-zinc-100">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none">
                            <div className="w-full h-full border-2 border-primary/50 border-dashed rounded-xl flex items-center justify-center">
                                <p className="text-white/60 text-xs font-medium uppercase tracking-widest text-center px-4">
                                    Position your ID card inside this frame
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full p-8 pb-12 flex flex-col items-center gap-6">
                        <button
                            onClick={capturePhoto}
                            className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center bg-white shadow-xl shadow-primary/20 active:scale-95 transition-all"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                                <Camera className="text-white w-8 h-8" />
                            </div>
                        </button>
                        <p className="text-zinc-400 text-sm font-medium">Capture your official Student ID card</p>
                    </div>
                </div>
            )}

            {step === "verifying" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
                            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
                            <Upload className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-zinc-900">Scanning Identity...</h2>
                        <p className="text-zinc-500 mt-2">Our AI is extracting your roll number from the ID.</p>
                    </div>
                </div>
            )}

            {step === "success" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-zinc-900">Verification Complete</h2>
                        <p className="text-zinc-500 mt-2">Welcome to the community, {rollNumber}!</p>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
