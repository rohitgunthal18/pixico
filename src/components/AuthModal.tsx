"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./AuthModal.module.css";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    contextMessage?: string;  // Optional message to display at top (e.g., "Sign in to save prompts")
}

type AuthStep = "choice" | "signin" | "signup" | "verify-signup" | "forgot" | "verify-reset" | "set-password";

export default function AuthModal({ isOpen, onClose, contextMessage }: AuthModalProps) {
    const {
        signUp,
        signIn,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        updatePassword,
        verifySignupOtp,
        resendSignupOtp,
        signInWithGoogle
    } = useAuth();

    const [step, setStep] = useState<AuthStep>("choice");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const modalRef = useRef<HTMLDivElement>(null);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleClose = () => {
        setStep("choice");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFullName("");
        setOtp(["", "", "", "", "", ""]);
        setNewPassword("");
        setConfirmNewPassword("");
        setError(null);
        setSuccess(null);
        setIsPasswordUpdated(false);
        setShowPassword(false);
        onClose();
    };

    const getOtpString = () => otp.join("");

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            const newOtp = [...otp];
            if (otp[index]) {
                newOtp[index] = "";
                setOtp(newOtp);
            } else if (index > 0) {
                newOtp[index - 1] = "";
                setOtp(newOtp);
                otpRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newOtp = [...otp];
        paste.split("").forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        otpRefs.current[Math.min(paste.length, 5)]?.focus();
    };

    const getErrorMessage = (errorMsg: string): string => {
        if (!errorMsg) return "An unexpected error occurred. Please try again.";
        const lowerError = errorMsg.toLowerCase();
        if (lowerError.includes("already registered") || lowerError.includes("already exists")) {
            return "This email is already registered. Please sign in instead.";
        }
        if (lowerError.includes("invalid login credentials") || lowerError.includes("invalid password")) {
            return "Invalid email or password. If you signed up with Google, use 'Continue with Google'.";
        }
        if (lowerError.includes("email not confirmed")) {
            return "Please verify your email first. Check your inbox for the code.";
        }
        if (lowerError.includes("too many requests") || lowerError.includes("rate limit")) {
            return "Too many attempts. Please wait a few minutes.";
        }
        if (lowerError.includes("invalid") && lowerError.includes("otp")) {
            return "Invalid or expired code. Please try again.";
        }
        if (lowerError.includes("user not found")) {
            return "No account found with this email. Please sign up first.";
        }
        if (lowerError.includes("new password should be different") || lowerError.includes("same as old")) {
            return "The new password must be different from your current one.";
        }
        return errorMsg;
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        setError(null);

        const { error, needsVerification } = await signUp(email, password, fullName);
        if (error) {
            setError(getErrorMessage(error.message));
        } else if (needsVerification) {
            setSuccess("Account created! Check your email for a verification code.");
            setOtp(["", "", "", "", "", ""]);
            setStep("verify-signup");
        } else {
            handleClose();
        }
        setIsLoading(false);
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;

        setIsLoading(true);
        setError(null);

        const { error } = await signIn(email, password);
        if (error) {
            if (error.message.toLowerCase().includes("email not confirmed")) {
                setError("Please verify your email first.");
                setOtp(["", "", "", "", "", ""]);
                setStep("verify-signup");
            } else {
                setError(getErrorMessage(error.message));
            }
        } else {
            handleClose();
        }
        setIsLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setError(null);

        const { error } = await sendPasswordResetOtp(email);
        if (error) {
            setError(getErrorMessage(error.message));
        } else {
            setSuccess("Password reset email sent! Check your inbox.");
            setOtp(["", "", "", "", "", ""]);
            setStep("verify-reset");
        }
        setIsLoading(false);
    };

    const handleVerifySignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpString = getOtpString();
        if (otpString.length !== 6) return;

        setIsLoading(true);
        setError(null);

        const { error } = await verifySignupOtp(email, otpString);
        if (error) {
            setError(getErrorMessage(error.message));
            setOtp(["", "", "", "", "", ""]);
        } else {
            setSuccess("Email verified! You are now signed in.");
            setTimeout(() => handleClose(), 1500);
        }
        setIsLoading(false);
    };

    const handleVerifyReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpString = getOtpString();
        if (otpString.length !== 6) return;

        setIsLoading(true);
        setError(null);

        const { error } = await verifyPasswordResetOtp(email, otpString);
        if (error) {
            setError(getErrorMessage(error.message));
            setOtp(["", "", "", "", "", ""]);
        } else {
            setSuccess("Code verified! Now set your new password.");
            setStep("set-password");
        }
        setIsLoading(false);
    };

    const handleSetNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword.trim()) return;
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            console.log("AuthModal: handleSetNewPassword triggered- email:", email);
            const { error } = await updatePassword(newPassword);
            console.log("AuthModal: updatePassword result:", error ? error.message : "SUCCESS");

            if (error) {
                setError(getErrorMessage(error.message));
            } else {
                setSuccess("Password updated successfully!");
                setIsPasswordUpdated(true);
                setNewPassword("");
                setConfirmNewPassword("");
                setTimeout(() => {
                    console.log("AuthModal: Closing after success...");
                    handleClose();
                }, 3000);
            }
        } catch (err) {
            console.error("AuthModal: Critical error in handleSetNewPassword:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            console.log("AuthModal: Setting isLoading(false)");
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        if (step === "verify-signup") {
            const { error } = await resendSignupOtp(email);
            if (error) setError(getErrorMessage(error.message));
            else setSuccess("New verification code sent!");
        } else if (step === "verify-reset") {
            const { error } = await sendPasswordResetOtp(email);
            if (error) setError(getErrorMessage(error.message));
            else setSuccess("New reset code sent!");
        }
        setOtp(["", "", "", "", "", ""]);
        setIsLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(getErrorMessage(error.message));
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const getTitle = () => {
        switch (step) {
            case "choice": return "Welcome to Pixico";
            case "signin": return "Sign In";
            case "signup": return "Create Account";
            case "verify-signup": return "Verify Email";
            case "forgot": return "Reset Password";
            case "verify-reset": return "Enter Reset Code";
            case "set-password": return "Set New Password";
            default: return "Welcome";
        }
    };

    const getSubtitle = () => {
        switch (step) {
            case "choice": return "Sign in to save prompts and use AI features";
            case "signin": return "Enter your credentials";
            case "signup": return "Create your account";
            case "verify-signup": return `Enter the 6-digit code sent to ${email}`;
            case "forgot": return "Enter your email to receive a reset code";
            case "verify-reset": return `Enter the 6-digit code sent to ${email}`;
            case "set-password": return "Choose a new password";
            default: return "";
        }
    };

    const EyeIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );

    const EyeOffIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* Context Message Banner */}
                {contextMessage && (
                    <div className={styles.contextBanner}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        {contextMessage}
                    </div>
                )}

                <div className={styles.header}>
                    <div className={styles.logo}>
                        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.logoIcon}>
                            <path d="M12 2l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5L12 2z" />
                        </svg>
                        <span>Pixico</span>
                    </div>
                    <h2 className={styles.title}>{getTitle()}</h2>
                    <p className={styles.subtitle}>{getSubtitle()}</p>
                </div>

                {error && (
                    <div className={styles.error}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        {error}
                    </div>
                )}

                {success && (
                    <div className={styles.success}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        {success}
                    </div>
                )}

                <div className={styles.content}>
                    {/* Choice */}
                    {step === "choice" && (
                        <>
                            <button className={styles.googleBtn} onClick={handleGoogleSignIn} disabled={isLoading}>
                                <svg viewBox="0 0 24 24" className={styles.googleIcon}>
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                            <div className={styles.divider}><span>or</span></div>
                            <button className={styles.primaryBtn} onClick={() => setStep("signin")} disabled={isLoading}>
                                Sign In with Email
                            </button>
                            <button className={styles.secondaryBtn} onClick={() => setStep("signup")} disabled={isLoading}>
                                Create New Account
                            </button>
                        </>
                    )}

                    {/* Sign In */}
                    {step === "signin" && (
                        <form onSubmit={handleSignIn} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="signin-email">Email</label>
                                <input type="email" id="signin-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="signin-password">Password</label>
                                <div className={styles.passwordInput}>
                                    <input type={showPassword ? "text" : "password"} id="signin-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                                    <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                            <button type="button" className={styles.forgotLink} onClick={() => setStep("forgot")}>Forgot password?</button>
                            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                {isLoading ? <span className={styles.spinner}></span> : "Sign In"}
                            </button>
                            <div className={styles.switchMode}>
                                Don&apos;t have an account? <button type="button" onClick={() => setStep("signup")}>Sign Up</button>
                            </div>
                            <button type="button" className={styles.backBtn} onClick={() => setStep("choice")}>← Back</button>
                        </form>
                    )}

                    {/* Sign Up */}
                    {step === "signup" && (
                        <form onSubmit={handleSignUp} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="signup-name">Full Name</label>
                                <input type="text" id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" autoFocus />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="signup-email">Email</label>
                                <input type="email" id="signup-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="signup-password">Password (min 6 chars)</label>
                                <div className={styles.passwordInput}>
                                    <input type={showPassword ? "text" : "password"} id="signup-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                                    <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="signup-confirm">Confirm Password</label>
                                <input type={showPassword ? "text" : "password"} id="signup-confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required minLength={6} />
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                {isLoading ? <span className={styles.spinner}></span> : "Create Account"}
                            </button>
                            <div className={styles.switchMode}>
                                Already have an account? <button type="button" onClick={() => setStep("signin")}>Sign In</button>
                            </div>
                            <button type="button" className={styles.backBtn} onClick={() => setStep("choice")}>← Back</button>
                        </form>
                    )}

                    {/* Verify Signup OTP */}
                    {step === "verify-signup" && (
                        <form onSubmit={handleVerifySignup} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label>Verification Code</label>
                                <div className={styles.otpBoxes}>
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { otpRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            onPaste={handleOtpPaste}
                                            className={styles.otpBox}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={isLoading || getOtpString().length !== 6}>
                                {isLoading ? <span className={styles.spinner}></span> : "Verify Email"}
                            </button>
                            <button type="button" className={styles.resendBtn} onClick={handleResendOtp} disabled={isLoading}>
                                Didn&apos;t get the code? Resend
                            </button>
                            <button type="button" className={styles.backBtn} onClick={() => setStep("signin")}>← Back to Sign In</button>
                        </form>
                    )}

                    {/* Forgot Password */}
                    {step === "forgot" && (
                        <form onSubmit={handleForgotPassword} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="forgot-email">Email</label>
                                <input type="email" id="forgot-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                {isLoading ? <span className={styles.spinner}></span> : "Send Reset Code"}
                            </button>
                            <button type="button" className={styles.backBtn} onClick={() => setStep("signin")}>← Back to Sign In</button>
                        </form>
                    )}

                    {/* Verify Reset OTP */}
                    {step === "verify-reset" && (
                        <form onSubmit={handleVerifyReset} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label>Reset Code</label>
                                <div className={styles.otpBoxes}>
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { otpRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            onPaste={handleOtpPaste}
                                            className={styles.otpBox}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={isLoading || getOtpString().length !== 6}>
                                {isLoading ? <span className={styles.spinner}></span> : "Verify Code"}
                            </button>
                            <button type="button" className={styles.resendBtn} onClick={handleResendOtp} disabled={isLoading}>
                                Didn&apos;t get the code? Resend
                            </button>
                            <button type="button" className={styles.backBtn} onClick={() => setStep("forgot")}>← Back</button>
                        </form>
                    )}

                    {/* Set New Password */}
                    {step === "set-password" && (
                        <form onSubmit={handleSetNewPassword} className={styles.form}>
                            {!isPasswordUpdated ? (
                                <>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="new-password">New Password</label>
                                        <div className={styles.passwordInput}>
                                            <input type={showPassword ? "text" : "password"} id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} autoFocus />
                                            <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="confirm-new-password">Confirm New Password</label>
                                        <input type={showPassword ? "text" : "password"} id="confirm-new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm password" required minLength={6} />
                                    </div>
                                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                        {isLoading ? <span className={styles.spinner}></span> : "Update Password"}
                                    </button>
                                </>
                            ) : (
                                <div className={styles.successWrapper}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#4ade80', marginBottom: '1rem' }}>
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <h3>Success!</h3>
                                    <p>{success}</p>
                                    <p className={styles.redirectHint}>Redirecting you back...</p>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                <p className={styles.terms}>
                    By continuing, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
