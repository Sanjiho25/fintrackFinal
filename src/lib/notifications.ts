

"use client";

import { LocalNotifications, type LocalNotificationSchema, type Schedule, type ScheduleOn } from '@capacitor/local-notifications';
import type { Notification as AppNotification, SavingGoal, Transaction } from '@/types'; // Import our app's Notification type
import { formatCurrency } from './utils';

export const DAILY_REMINDER_ID = 101;
export const WEEKLY_SUMMARY_ID = 102;
const TRANSACTION_NOTIFICATION_ID_OFFSET = 20000;


// We'll use a high number range for goal IDs to avoid conflicts.
// This assumes we won't have more than 9000 goals, which is a safe bet.
const GOAL_NOTIFICATION_ID_OFFSET = 10000;

export const checkPermissions = async () => {
    return await LocalNotifications.checkPermissions();
};

export const requestPermissions = async () => {
    return await LocalNotifications.requestPermissions();
};

// Ensure a default notification channel exists (Android 8+). Call on app init.
export const ensureNotificationChannel = async () => {
    try {
        await LocalNotifications.createChannel({
            id: 'fintrack_default',
            name: 'FinTrack Notifications',
            description: 'General notifications from FinTrack',
            importance: 5, // High importance
            sound: undefined,
        });
        console.log('Notification channel ensured: fintrack_default');
    } catch (e) {
        console.warn('Could not ensure notification channel:', e);
    }
};

// Open exact alarm settings (Android) so user can enable exact alarms if needed
export const openExactAlarmSettings = async () => {
    try {
        const res = await LocalNotifications.changeExactNotificationSetting();
        console.log('changeExactNotificationSetting result:', res);
        return res;
    } catch (e) {
        console.warn('Could not open exact alarm settings:', e);
        return null;
    }
};

export const scheduleDailyReminder = async (): Promise<AppNotification | null> => {
    try {
        await cancelNotification(DAILY_REMINDER_ID); // Cancel any existing one first
        
        const dailyNotif: Omit<LocalNotificationSchema, 'id'> = {
            title: "👋 Daily Check-in!",
            body: "Don't forget to log your income and expenses for today to stay on track.",
            schedule: {
                every: 'day',
                on: {
                    hour: 20,
                    minute: 0,
                },
                // Allow firing during Doze/idle on Android when appropriate
                allowWhileIdle: true
            },
            sound: undefined,
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#67C7A3'
        };

        await LocalNotifications.schedule({
            notifications: [{ ...dailyNotif, id: DAILY_REMINDER_ID, channelId: 'fintrack_default' }],
        });
        
        // Debug: log what we just scheduled
        try {
            const pending = await LocalNotifications.getPending();
            console.log('Pending after scheduling daily reminder:', pending.notifications);
        } catch (e) {
            console.warn('Could not fetch pending notifications after scheduling daily reminder:', e);
        }
        console.log("Daily reminder scheduled successfully.");
        // Return a storable version of the notification
        return {
            id: String(DAILY_REMINDER_ID),
            title: dailyNotif.title,
            body: dailyNotif.body,
            createdAt: new Date(),
            read: false,
        };

    } catch (e) {
        console.error("Error scheduling daily reminder:", e);
        return null;
    }
};

export const scheduleWeeklySummary = async (): Promise<AppNotification | null> => {
    try {
        await cancelNotification(WEEKLY_SUMMARY_ID); // Cancel any existing one first
        
        const weeklyNotif: Omit<LocalNotificationSchema, 'id'> = {
            title: "📊 Your Weekly Summary is Ready!",
            body: "Check your financial insights to see how you did this week.",
            schedule: {
                every: 'week',
                on: {
                    weekday: 2, // Monday (Weekday enum: Sunday=1, Monday=2)
                    hour: 12,   // 12 PM Noon
                    minute: 0,
                },
                // Allow firing during Doze/idle on Android when appropriate
                allowWhileIdle: true
            },
            sound: undefined,
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#67C7A3'
        };

        await LocalNotifications.schedule({
            notifications: [{ ...weeklyNotif, id: WEEKLY_SUMMARY_ID, channelId: 'fintrack_default' }],
        });
        
        // Debug: log what we just scheduled
        try {
            const pending = await LocalNotifications.getPending();
            console.log('Pending after scheduling weekly summary:', pending.notifications);
        } catch (e) {
            console.warn('Could not fetch pending notifications after scheduling weekly summary:', e);
        }
        console.log("Weekly summary scheduled successfully.");
        return {
            id: String(WEEKLY_SUMMARY_ID),
            title: weeklyNotif.title,
            body: weeklyNotif.body,
            createdAt: new Date(),
            read: false,
        };

    } catch (e) {
        console.error("Error scheduling weekly summary:", e);
        return null;
    }
};

// New function to schedule goal reminders
export const scheduleGoalReminder = async (goal: SavingGoal): Promise<AppNotification | null> => {
    if (!goal.savingMode) {
        console.log(`Goal "${goal.name}" has no saving mode. Skipping reminder.`);
        return null;
    }

    // Create a unique ID for the goal notification that is deterministic
    const notificationId = GOAL_NOTIFICATION_ID_OFFSET + parseInt(goal.id.replace(/[^0-9]/g, '').slice(-4));

    try {
        // Always cancel the previous reminder for this goal before setting a new one
        await cancelNotification(notificationId);

        let schedule: Schedule;
        const now = new Date();
        switch (goal.savingMode) {
            case 'daily':
                // Schedule next occurrence at noon (or tomorrow if noon already passed) and repeat
                const nextNoon = new Date();
                nextNoon.setHours(12, 0, 0, 0);
                if (nextNoon.getTime() <= Date.now()) {
                    nextNoon.setDate(nextNoon.getDate() + 1);
                }
                schedule = {
                    at: nextNoon,
                    repeats: true,
                    allowWhileIdle: true,
                };
                break;
            case 'weekly':
                // Repeat weekly on the current weekday at noon (Weekday enum: Sunday=1)
                schedule = {
                    every: 'week',
                    on: {
                        weekday: now.getDay() + 1,
                        hour: 12,
                        minute: 0,
                    },
                    allowWhileIdle: true
                }; 
                break;
            case 'monthly':
                // Repeat monthly on the same day-of-month at noon
                schedule = {
                    every: 'month',
                    on: {
                        day: now.getDate(),
                        hour: 12,
                        minute: 0,
                    },
                    allowWhileIdle: true
                }; 
                break;
            default:
                console.warn(`Unknown savingMode "${goal.savingMode}" for goal "${goal.name}". Skipping schedule.`);
                return null;
        }

        const goalNotif: Omit<LocalNotificationSchema, 'id'> = {
            title: `🎯 Time to Save for "${goal.name}"!`,
            body: `It's time for your ${goal.savingMode} contribution. Keep up the great work!`,
            schedule: schedule,
            sound: undefined,
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#E6B86A', // Accent color for goals
        };
        
        console.log(`Scheduling goal reminder for "${goal.name}" (id=${notificationId}) with schedule:`, schedule);

        await LocalNotifications.schedule({
            notifications: [{ ...goalNotif, id: notificationId, channelId: 'fintrack_default' }],
        });
        
        // Debug: confirm pending
        try {
            const pending = await LocalNotifications.getPending();
            console.log(`Pending after scheduling goal (id=${notificationId}):`, pending.notifications.filter(n => n.id === notificationId));
        } catch (e) {
            console.warn(`Could not fetch pending notifications after scheduling goal "${goal.name}":`, e);
        }
        console.log(`Successfully scheduled ${goal.savingMode} reminder for goal "${goal.name}".`);

        return {
            id: String(notificationId),
            title: goalNotif.title,
            body: goalNotif.body,
            createdAt: new Date(),
            read: false,
        };

    } catch (e) {
        console.error(`Error scheduling reminder for goal "${goal.name}":`, e);
        return null;
    }
};

export const triggerTestNotification = async (type: 'daily' | 'weekly' | 'goal'): Promise<AppNotification | null> => {
    let notifOptions: Omit<LocalNotificationSchema, 'id'>;
    const notificationId = Math.floor(Math.random() * 1000) + 200; // Random ID for test

    const schedule = {
        at: new Date(Date.now() + 1000), // Fire 1 second from now
    };

    switch (type) {
        case 'weekly':
            notifOptions = {
                title: "📊 DEMO: Weekly Summary",
                body: "This is a test of your weekly summary notification.",
                iconColor: '#67C7A3',
                schedule,
            };
            break;
        case 'goal':
            notifOptions = {
                title: "🎯 DEMO: Goal Reminder",
                body: "This is a test of a saving goal reminder.",
                iconColor: '#E6B86A',
                schedule,
            };
            break;
        case 'daily':
        default:
            notifOptions = {
                title: "👋 DEMO: Daily Check-in",
                body: "This is a test of your daily check-in notification.",
                iconColor: '#67C7A3',
                schedule,
            };
            break;
    }

    try {
        await LocalNotifications.schedule({
            notifications: [{ ...notifOptions, id: notificationId, smallIcon: 'ic_stat_icon_config_sample' }],
        });

        console.log(`Triggered test notification: ${type}`);

        return {
            id: String(notificationId),
            title: notifOptions.title,
            body: notifOptions.body,
            createdAt: new Date(),
            read: false,
        };
    } catch (e) {
        console.error(`Error triggering test notification for ${type}:`, e);
        return null;
    }
};

export const triggerTransactionNotification = async (transaction: Transaction, categoryLabel: string): Promise<void> => {
    try {
        const title = transaction.type === 'income' ? 'Income Logged' : 'Expense Logged';
        const body = `${categoryLabel}: ${formatCurrency(transaction.amount)}`;
        const notificationId = TRANSACTION_NOTIFICATION_ID_OFFSET + Math.floor(Math.random() * 9999);

        await LocalNotifications.schedule({
            notifications: [{
                id: notificationId,
                title,
                body,
                schedule: { at: new Date(Date.now() + 500) }, // Schedule 0.5s in the future
                smallIcon: 'ic_stat_icon_config_sample',
                iconColor: transaction.type === 'income' ? '#E6B86A' : '#67C7A3',
                channelId: 'fintrack_default'
            }]
        });
    } catch (e) {
        console.error("Error triggering transaction notification:", e);
    }
};


// New function to cancel a specific goal reminder
export const cancelGoalReminder = async (goalId: string) => {
    const notificationId = GOAL_NOTIFICATION_ID_OFFSET + parseInt(goalId.replace(/[^0-9]/g, '').slice(-4));
    await cancelNotification(notificationId);
    console.log(`Cancelled reminder for goal ID ${goalId}.`);
};

export const cancelNotification = async (id: number) => {
    try {
        const pending = await LocalNotifications.getPending();
        const notificationExists = pending.notifications.some(n => n.id === id);
        if (notificationExists) {
            await LocalNotifications.cancel({ notifications: [{ id }] });
            console.log(`Notification with ID ${id} cancelled.`);
        }
    } catch (e) {
        console.error(`Error cancelling notification with ID ${id}:`, e);
    }
};

export const cancelAllNotifications = async () => {
    try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
            console.log("All pending notifications cancelled.");
        }
    } catch (e) {
        console.error("Error cancelling all notifications:", e);
    }
};

// Debug helper: list pending notifications (useful for debugging scheduling issues)
export const listPendingNotifications = async () => {
    try {
        const pending = await LocalNotifications.getPending();
        console.log('Pending local notifications:', pending.notifications);
        return pending.notifications;
    } catch (e) {
        console.error('Error fetching pending notifications:', e);
        return [];
    }
};

// Register a basic listener to log delivered notifications (call once on app init)
export const initNotificationListeners = async () => {
    try {
        // Ensure channel exists
        await ensureNotificationChannel();

        await LocalNotifications.addListener('localNotificationReceived', (notification) => {
            console.log('Local notification received (listener):', notification);
        });
        console.log('Local notification listener registered');

        // Check exact alarm settings (Android) and log guidance if not granted
        try {
            const exact = await LocalNotifications.checkExactNotificationSetting();
            if (exact && exact.exact_alarm !== 'granted') {
                console.warn('Exact alarm setting is not granted. For reliable scheduled notifications while the app is closed, consider enabling exact alarms in app settings.');
            }
        } catch (e) {
            // Not available or failed; ignore
        }

    } catch (e) {
        console.warn('Could not register local notification listener:', e);
    }
};

    
