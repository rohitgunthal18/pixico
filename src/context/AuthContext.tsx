"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: "user" | "admin";
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isAdmin: boolean;
    // Password auth methods
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; needsVerification: boolean }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    // OTP-based password reset
    sendPasswordResetOtp: (email: string) => Promise<{ error: Error | null }>;
    verifyPasswordResetOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
    updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
    // OTP verification (for email confirmation)
    verifySignupOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
    resendSignupOtp: (email: string) => Promise<{ error: Error | null }>;
    // OAuth
    signInWithGoogle: () => Promise<{ error: Error | null }>;
    // Session management
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            return null;
        }
        return data as Profile;
    };

    const refreshProfile = async () => {
        if (user) {
            const newProfile = await fetchProfile(user.id);
            setProfile(newProfile);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).then(setProfile);
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                const newProfile = await fetchProfile(session.user.id);
                setProfile(newProfile);
            } else {
                setProfile(null);
            }

            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Generate username from name
    const generateUsername = (name: string): string => {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${cleanName}${randomNum}`;
    };

    // Sign up with email and password
    const signUp = async (email: string, password: string, fullName?: string) => {
        const nameForUsername = fullName || email.split("@")[0];
        const username = generateUsername(nameForUsername);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName || null,
                    username: username,
                },
            },
        });

        if (error) {
            return { error: error as Error, needsVerification: false };
        }

        // Check if email confirmation is required
        // If identities array is empty, user already exists
        if (data.user?.identities && data.user.identities.length === 0) {
            return {
                error: new Error("This email is already registered. Please sign in instead."),
                needsVerification: false
            };
        }

        const needsVerification = !data.session;
        return { error: null, needsVerification };
    };

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error as Error | null };
    };

    // Send OTP for password reset - uses resetPasswordForEmail
    // IMPORTANT: User must update "Reset Password" template in Supabase to use {{ .Token }} instead of link
    const sendPasswordResetOtp = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            return { error: error as Error };
        }

        return { error: null };
    };

    // Verify OTP for password reset - uses "recovery" type
    const verifyPasswordResetOtp = async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "recovery", // Use "recovery" for password resets
        });

        // On success, verifyOtp establishes a session automatically
        return { error: error as Error | null };
    };

    // Update password (user must be logged in via OTP verification)
    const updatePassword = async (newPassword: string) => {
        try {
            // Check if we have an active session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { error: new Error("Session expired. Please verify your OTP code again.") };
            }

            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            return { error: error as Error | null };
        } catch (err) {
            return { error: err instanceof Error ? err : new Error("Failed to update password") };
        }
    };

    // Verify OTP for signup email confirmation
    const verifySignupOtp = async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "signup",
        });
        return { error: error as Error | null };
    };

    // Resend signup verification OTP
    const resendSignupOtp = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: "signup",
            email,
        });
        return { error: error as Error | null };
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { error: error as Error | null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    const value: AuthContextType = {
        user,
        profile,
        session,
        isLoading,
        isAdmin: profile?.role === "admin",
        signUp,
        signIn,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        updatePassword,
        verifySignupOtp,
        resendSignupOtp,
        signInWithGoogle,
        signOut,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
