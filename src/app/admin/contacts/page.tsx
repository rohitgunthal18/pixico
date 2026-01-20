"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface Contact {
    id: string;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    status: string;
    admin_notes: string | null;
    created_at: string;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/admin/contacts');
            const result = await response.json();

            if (!result.success) {
                setError(result.error || "Failed to load contacts");
            } else {
                setContacts(result.data || []);
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (contactId: string, newStatus: string) => {
        try {
            const response = await fetch('/api/admin/contacts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: contactId,
                    status: newStatus,
                    replied_at: newStatus === "replied" ? new Date().toISOString() : null
                })
            });

            const result = await response.json();

            if (!result.success) {
                alert("Failed to update status: " + result.error);
            } else {
                setContacts(contacts.map(c =>
                    c.id === contactId ? { ...c, status: newStatus } : c
                ));
                if (selectedContact?.id === contactId) {
                    setSelectedContact({ ...selectedContact, status: newStatus });
                }
            }
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedContact) return;

        try {
            const response = await fetch('/api/admin/contacts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedContact.id,
                    admin_notes: adminNotes
                })
            });

            const result = await response.json();

            if (!result.success) {
                alert("Failed to save notes: " + result.error);
            } else {
                setContacts(contacts.map(c =>
                    c.id === selectedContact.id ? { ...c, admin_notes: adminNotes } : c
                ));
                setSelectedContact({ ...selectedContact, admin_notes: adminNotes });
                alert("Notes saved successfully!");
            }
        } catch (err) {
            alert("Failed to save notes");
        }
    };

    const handleDelete = async (contactId: string) => {
        if (!confirm("Delete this contact query?")) return;

        try {
            const response = await fetch(`/api/admin/contacts?id=${contactId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!result.success) {
                alert("Failed to delete: " + result.error);
            } else {
                setContacts(contacts.filter(c => c.id !== contactId));
                if (selectedContact?.id === contactId) {
                    setSelectedContact(null);
                }
            }
        } catch (err) {
            alert("Failed to delete contact");
        }
    };

    const filteredContacts = contacts.filter(contact =>
        statusFilter === "all" || contact.status === statusFilter
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <h1>Contact Queries</h1>
                </header>
                <div className={styles.errorBox}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                    </svg>
                    <p>{error}</p>
                    <button onClick={fetchContacts} className={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1>Contact Queries</h1>
                <span className={styles.count}>{contacts.length} total</span>
                <button onClick={fetchContacts} className={styles.refreshBtn} title="Refresh">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                    </svg>
                </button>
            </header>

            <div className={styles.content}>
                {/* List */}
                <div className={styles.list}>
                    <div className={styles.filters}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Status</option>
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    {filteredContacts.length === 0 ? (
                        <div className={styles.empty}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <p>No contact queries found.</p>
                            {contacts.length > 0 && statusFilter !== "all" && (
                                <button
                                    onClick={() => setStatusFilter("all")}
                                    className={styles.clearFilterBtn}
                                >
                                    Clear filter
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.contactList}>
                            {filteredContacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className={`${styles.contactItem} ${selectedContact?.id === contact.id ? styles.active : ""} ${contact.status === "new" ? styles.unread : ""}`}
                                    onClick={() => {
                                        setSelectedContact(contact);
                                        setAdminNotes(contact.admin_notes || "");
                                        if (contact.status === "new") {
                                            handleStatusChange(contact.id, "read");
                                        }
                                    }}
                                >
                                    <div className={styles.contactHeader}>
                                        <span className={styles.contactName}>{contact.name}</span>
                                        <span className={`${styles.statusDot} ${styles[contact.status]}`}></span>
                                    </div>
                                    <span className={styles.contactEmail}>{contact.email}</span>
                                    <span className={styles.contactSubject}>{contact.subject || "No subject"}</span>
                                    <span className={styles.contactDate}>{formatDate(contact.created_at)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail */}
                <div className={styles.detail}>
                    {selectedContact ? (
                        <>
                            <div className={styles.detailHeader}>
                                <div>
                                    <h2>{selectedContact.name}</h2>
                                    <a href={`mailto:${selectedContact.email}`} className={styles.email}>
                                        {selectedContact.email}
                                    </a>
                                </div>
                                <select
                                    value={selectedContact.status}
                                    onChange={(e) => handleStatusChange(selectedContact.id, e.target.value)}
                                    className={`${styles.statusSelect} ${styles[selectedContact.status]}`}
                                >
                                    <option value="new">New</option>
                                    <option value="read">Read</option>
                                    <option value="replied">Replied</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>

                            {selectedContact.subject && (
                                <div className={styles.subject}>
                                    <strong>Subject:</strong> {selectedContact.subject}
                                </div>
                            )}

                            <div className={styles.messageBox}>
                                <label>Message</label>
                                <div className={styles.message}>
                                    {selectedContact.message}
                                </div>
                            </div>

                            <div className={styles.notesBox}>
                                <label>Admin Notes</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add internal notes..."
                                    rows={4}
                                />
                                <button onClick={handleSaveNotes} className={styles.saveBtn}>
                                    Save Notes
                                </button>
                            </div>

                            <div className={styles.actions}>
                                <a
                                    href={`mailto:${selectedContact.email}?subject=Re: ${encodeURIComponent(selectedContact.subject || "Your inquiry")}&body=${encodeURIComponent(`Hi ${selectedContact.name},\n\nThank you for reaching out to us.\n\n---\nOriginal message:\n${selectedContact.message}\n---\n\nBest regards,\nPixico Team`)}`}
                                    className={styles.replyBtn}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                    </svg>
                                    Reply via Email
                                </a>
                                <button
                                    onClick={() => handleDelete(selectedContact.id)}
                                    className={styles.deleteBtn}
                                >
                                    Delete
                                </button>
                            </div>

                            <div className={styles.meta}>
                                Received: {formatDate(selectedContact.created_at)}
                            </div>
                        </>
                    ) : (
                        <div className={styles.noSelection}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <p>Select a message to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
