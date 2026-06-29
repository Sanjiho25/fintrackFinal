
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Trash2, Eye, EyeOff, Beaker } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { loadAppData, saveAppData } from "@/lib/storage";
import type { AppData, Notification as AppNotification } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { triggerTestNotification } from "@/lib/notifications";


export default function NotificationsPage() {
  const { user } = useAuth();
  const [appData, setAppData] = React.useState<AppData | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const { toast } = useToast();
  const [notificationToDelete, setNotificationToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      const data = loadAppData(user.uid);
      setAppData(data);
      setIsLoaded(true);
    }
  }, [user]);

  React.useEffect(() => {
    if (isLoaded && appData && user) {
        saveAppData(appData, user.uid);
    }
  }, [appData, isLoaded, user]);

  const sortedNotifications = React.useMemo(() => {
    if (!appData?.notifications) return [];
    return [...appData.notifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [appData?.notifications]);

  const handleToggleRead = (id: string) => {
    setAppData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            notifications: prev.notifications.map(n => n.id === id ? { ...n, read: !n.read } : n)
        }
    });
  };

  const handleDeleteNotification = (id: string) => {
    const notif = appData?.notifications.find(n => n.id === id);
    if (notif) {
        toast({ title: "Notification Deleted", description: `"${notif.title}" was removed.` });
    }

    setAppData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== id)
        }
    });
    setNotificationToDelete(null);
  };
  
  const handleMarkAllAsRead = () => {
    toast({ title: "All Marked as Read" });
    setAppData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        notifications: prev.notifications.map(n => ({...n, read: true }))
      }
    });
  };

  const handleTestNotification = async (type: 'daily' | 'weekly' | 'goal') => {
    try {
        const newNotif = await triggerTestNotification(type);
        if (newNotif) {
            setAppData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    notifications: [newNotif, ...prev.notifications]
                }
            });
            toast({
                title: "Demo Notification Triggered",
                description: `A "${type}" style notification was sent to your device.`
            });
        } else {
            throw new Error("Could not create notification object.");
        }
    } catch (e: any) {
        toast({
            title: "Failed to Trigger Demo",
            description: e.message || "Please ensure notifications are enabled for this app.",
            variant: "destructive"
        });
    }
  };


  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-4 border-b sticky top-0 bg-background z-10">
        <Link href="/profile" passHref>
          <Button asChild variant="ghost" size="icon" aria-label="Back to Profile">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold ml-2">Notification History</h1>
        {sortedNotifications.some(n => !n.read) && (
             <Button variant="outline" size="sm" className="ml-auto" onClick={handleMarkAllAsRead}>
                <Eye className="mr-2 h-4 w-4"/>
                Mark All as Read
            </Button>
        )}
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-grow p-4">
        <Card className="mb-4 bg-secondary/30 border-dashed">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Beaker className="h-5 w-5 text-primary"/>
                    Demo Triggers
                </CardTitle>
                <CardDescription className="text-xs">
                    Use these buttons to send a test notification to your device immediately.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleTestNotification('daily')}>
                    Trigger Daily Check-in
                </Button>
                 <Button size="sm" variant="outline" onClick={() => handleTestNotification('weekly')}>
                    Trigger Weekly Summary
                </Button>
                 <Button size="sm" variant="outline" onClick={() => handleTestNotification('goal')}>
                    Trigger Goal Reminder
                </Button>
            </CardContent>
        </Card>


        {isLoaded && sortedNotifications.length === 0 && (
          <Card className="border-dashed mt-4">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Bell className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">No Notifications Yet</p>
              <p className="text-sm">
                Your app notifications will appear here.
              </p>
            </CardContent>
          </Card>
        )}
        <div className="space-y-3">
          {sortedNotifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "group relative flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-secondary/50",
                !notif.read && "bg-secondary/30 border-primary/20"
              )}
            >
              {!notif.read && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" title="Unread"></div>
              )}
              <div className="flex-shrink-0 mt-1">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", notif.read ? 'bg-muted' : 'bg-primary/20')}>
                    <Bell className={cn("h-4 w-4", notif.read ? 'text-muted-foreground' : 'text-primary')}/>
                </div>
              </div>
              <div className="flex-1">
                <p className={cn("font-semibold text-sm", !notif.read && "text-foreground")}>{notif.title}</p>
                <p className={cn("text-sm", notif.read ? 'text-muted-foreground' : 'text-foreground/80')}>{notif.body}</p>
                <p className="text-xs text-muted-foreground mt-1" title={format(notif.createdAt, "PPP p")}>
                  {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                </p>
              </div>
              <div className="flex flex-col gap-1 -mr-2 -my-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleRead(notif.id)} title={notif.read ? "Mark as unread" : "Mark as read"}>
                  {notif.read ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setNotificationToDelete(notif.id)} title="Delete notification">
                    <Trash2 className="h-4 w-4"/>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
       <AlertDialog open={!!notificationToDelete} onOpenChange={() => setNotificationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => notificationToDelete && handleDeleteNotification(notificationToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
