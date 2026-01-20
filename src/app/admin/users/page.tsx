"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        const supabase = createClient();

        try {
            const { data, error: fetchError } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (fetchError) throw fetchError;
            setUsers(data || []);
        } catch (err) {
            setError("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        const supabase = createClient();

        try {
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("id", userId);

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setSuccess(`User role updated to ${newRole}`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err?.message || "Failed to update user role");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading users...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerTitle}>
                        <h1>Users</h1>
                        <p>Manage user accounts and roles</p>
                    </div>
                    <div className={styles.headerStats}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{users.length}</span>
                            <span className={styles.statLabel}>Total Users</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{users.filter(u => u.role === "admin").length}</span>
                            <span className={styles.statLabel}>Admins</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Alerts */}
            {error && (
                <div className={styles.alert + " " + styles.alertError}>
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {success && (
                <div className={styles.alert + " " + styles.alertSuccess}>
                    <span>{success}</span>
                </div>
            )}

            {/* Search */}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4-4" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* Users Grid */}
            <div className={styles.usersGrid}>
                {filteredUsers.map((user) => (
                    <div key={user.id} className={styles.userCard}>
                        <div className={styles.userHeader}>
                            {user.avatar_url ? (
                                <Image
                                    src={user.avatar_url}
                                    alt={user.full_name || "User"}
                                    width={48}
                                    height={48}
                                    className={styles.avatar}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {user.full_name?.[0] || user.email?.[0] || "U"}
                                </div>
                            )}
                            <div className={styles.userInfo}>
                                <h3>{user.full_name || "No name"}</h3>
                                <p>{user.email}</p>
                            </div>
                        </div>
                        <div className={styles.userMeta}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Joined</span>
                                <span className={styles.metaValue}>{formatDate(user.created_at)}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Role</span>
                                <select
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    className={`${styles.roleSelect} ${user.role === "admin" ? styles.roleAdmin : ""}`}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No users found</p>
                </div>
            )}
        </div>
    );
}
