"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount, createMissingOrderNotifications } from "@/lib/notifications";
import { Notification } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Notifications() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        // Create missing notifications for orders that need tracking
        createMissingOrderNotifications(user.uid).then((created) => {
            if (created > 0) {
                console.log(`✅ Created ${created} missing order notifications`);
            }
        }).catch((error) => {
            console.error("Error creating missing notifications:", error);
        });

        // Subscribe to real-time notifications
        const unsubscribe = subscribeToNotifications(user.uid, (notifs) => {
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markNotificationAsRead(notification.id, user?.uid);
        }
        
        setIsOpen(false);
        
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        await markAllNotificationsAsRead(user.uid);
    };

    if (!user) {
        return null;
    }

    const unreadNotifications = notifications.filter(n => !n.read);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded transition-colors"
                aria-label="Notifications"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-96 bg-white border-4 border-black shadow-2xl z-50 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b-4 border-black bg-gray-50 flex justify-between items-center sticky top-0">
                            <h3 className="font-heading text-lg">Benachrichtigungen</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-sm text-black underline decoration-accent decoration-2 underline-offset-2"
                                >
                                    Alle als gelesen markieren
                                </button>
                            )}
                        </div>
                        
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600">Lädt...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-600">Keine Benachrichtigungen</p>
                            </div>
                        ) : (
                            <div className="divide-y-2 divide-gray-200">
                                {notifications.map((notification, index) => {
                                    // Highlight the latest sale notification (new_order type)
                                    const isLatestSale = notification.type === 'new_order' && 
                                        (index === 0 || notifications.slice(0, index).every(n => n.type !== 'new_order'));
                                    
                                    return (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                                            !notification.read ? 'bg-blue-50' : ''
                                        } ${
                                            isLatestSale ? 'border-l-4 border-green-500 bg-green-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {notification.type === 'new_order' && '🛒'}
                                                {notification.type === 'purchase_success' && '🎉'}
                                                {notification.type === 'tracking_submitted' && '📦'}
                                                {notification.type === 'tracking_approved' && '✅'}
                                                {notification.type === 'order_shipped' && '🚚'}
                                                {notification.type === 'order_delivered' && '📬'}
                                                {notification.type === 'highest_bidder' && '🏆'}
                                                {notification.type === 'outbid' && '⚠️'}
                                                {notification.type === 'please_review' && '⭐'}
                                                {notification.type === 'new_message' && '💬'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-heading text-sm mb-1 ${
                                                    !notification.read ? 'font-bold' : ''
                                                }`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(notification.createdAt).toLocaleString('de-DE', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                            )}
                                        </div>
                                    </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}


