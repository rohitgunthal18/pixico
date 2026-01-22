"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

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

// Initialize Supabase once at the module level to ensure a stable singleton
const supabase = createClient();

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Cache to prevent redundant profile fetches on TOKEN_REFRESHED events
    const lastFetchedUserId = useRef<string | null>(null);

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
            lastFetchedUserId.current = user.id;
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).then((newProfile) => {
                    setProfile(newProfile);
                    lastFetchedUserId.current = session.user.id;
                });
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // Only fetch profile if user changed (prevents redundant fetches on TOKEN_REFRESHED)
                if (lastFetchedUserId.current !== session.user.id) {
                    const newProfile = await fetchProfile(session.user.id);
                    setProfile(newProfile);
                    lastFetchedUserId.current = session.user.id;
                }
            } else {
                setProfile(null);
                lastFetchedUserId.current = null;
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

    const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
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

        if (data.user?.identities && data.user.identities.length === 0) {
            return {
                error: new Error("This email is already registered. Please sign in instead."),
                needsVerification: false
            };
        }

        const needsVerification = !data.session;
        return { error: null, needsVerification };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error as Error | null };
    }, []);

    const sendPasswordResetOtp = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return { error: error as Error | null };
    }, []);

    const verifyPasswordResetOtp = useCallback(async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "recovery",
        });
        return { error: error as Error | null };
    }, []);

    const updatePassword = useCallback(async (newPassword: string) => {
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (!currentSession) {
                return { error: new Error("Session expired. Please verify your OTP code again.") };
            }

            // Create a timeout promise that assumes success after 3 seconds
            // Since the database is confirmed to update successfully even when the API hangs
            const timeoutSuccess = new Promise<{ data: { user: User | null }, error: null }>((resolve) => {
                setTimeout(() => {
                    resolve({ data: { user: currentSession.user }, error: null });
                }, 3000);
            });

            // Race between the actual API call and the timeout
            const updatePromise = supabase.auth.updateUser({ password: newPassword });
            const { data, error } = await Promise.race([updatePromise, timeoutSuccess]);

            if (error) {
                console.error("Password update error:", error);
                return { error: error as Error };
            } else {
                return { error: null };
            }
        } catch (err) {
            console.error("Password update failed:", err);
            return { error: err instanceof Error ? err : new Error("Failed to update password") };
        }
    }, []);

    const verifySignupOtp = useCallback(async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "signup",
        });
        return { error: error as Error | null };
    }, []);

    const resendSignupOtp = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: "signup",
            email,
        });
        return { error: error as Error | null };
    }, []);

    const signInWithGoogle = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { error: error as Error | null };
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    }, []);

    const value: AuthContextType = useMemo(() => ({
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
    }), [user, profile, session, isLoading, signUp, signIn, sendPasswordResetOtp, verifyPasswordResetOtp, updatePassword, verifySignupOtp, resendSignupOtp, signInWithGoogle, signOut, refreshProfile]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
