"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    const router = useRouter();
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

    useEffect(() => {
        if (!recaptchaVerifier.current && recaptchaRef.current) {
            try {
                recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
                    size: "invisible",
                    callback: () => {
                        // reCAPTCHA solved, allow signInWithPhoneNumber.
                    },
                });
            } catch (error) {
                console.error("Recaptcha init error:", error);
            }
        }
    }, []);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || phone.length < 10) {
            toast.error("Please enter a valid phone number");
            return;
        }

        setLoading(true);
        try {
            const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
            const appVerifier = recaptchaVerifier.current;

            if (!appVerifier) {
                throw new Error("Recaptcha not initialized");
            }

            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(result);
            setStep("otp");
            toast.success("OTP sent to your phone");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            if (!confirmationResult) {
                throw new Error("No confirmation result found");
            }

            await confirmationResult.confirm(otp);
            toast.success("Login successful!");
            router.push("/auth/verify"); // Proceed to OCR verification
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
            <div id="recaptcha-container" ref={recaptchaRef}></div>

            <Card className="w-full max-w-sm border-none shadow-none bg-transparent">
                <CardHeader className="space-y-1 px-0 pb-8 text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-4">
                        {step === "phone" ? (
                            <Phone className="w-8 h-8 text-primary" />
                        ) : (
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        )}
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        {step === "phone" ? "Welcome back" : "Confirm OTP"}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 text-base">
                        {step === "phone"
                            ? "Enter your phone number to continue"
                            : `Enter the code sent to ${phone}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <form onSubmit={step === "phone" ? handleSendOtp : handleVerifyOtp} className="space-y-6">
                        <div className="space-y-2">
                            {step === "phone" ? (
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">+91</span>
                                    <Input
                                        type="tel"
                                        placeholder="9876543210"
                                        className="pl-14 h-14 bg-white border-zinc-200 rounded-2xl text-lg focus:ring-primary focus:border-primary transition-all"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                        disabled={loading}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <Input
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    className="h-14 bg-white border-zinc-200 rounded-2xl text-center text-2xl tracking-[0.5em] font-bold focus:ring-primary focus:border-primary transition-all"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    disabled={loading}
                                    autoFocus
                                />
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    {step === "phone" ? "Send Code" : "Verify & Continue"}
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                {step === "otp" && (
                    <CardFooter className="px-0 pt-4 flex justify-center">
                        <button
                            onClick={() => setStep("phone")}
                            className="text-sm font-medium text-zinc-500 hover:text-primary transition-colors"
                        >
                            Change phone number
                        </button>
                    </CardFooter>
                )}
            </Card>

            <p className="mt-8 text-center text-zinc-400 text-sm">
                By continuing, you agree to our <br />
                <span className="underline underline-offset-4">Terms</span> and <span className="underline underline-offset-4">Privacy Policy</span>
            </p>
        </div>
    );
}
