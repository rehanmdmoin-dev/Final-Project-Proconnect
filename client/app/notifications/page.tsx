"use client";
import { useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchNotifications, markAllRead } from "@/redux/slice/socialSlice";
import { cn, timeAgo } from "@/lib/utils";

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const { notifications, unread } = useAppSelector((s) => s.social);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  return (
    <>
      <Topbar
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "You're all caught up"}
        action={unread > 0 ? (
          <Button size="sm" variant="secondary" onClick={() => dispatch(markAllRead())}>
            <CheckCheck size={15} /> Mark all read
          </Button>
        ) : null}
      />

      <div className="w-full px-5 lg:px-9 py-6">
        {notifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={Bell}
              title="Nothing here yet"
              body="Application updates, connection requests and interview invitations will land here."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line-soft">
              {notifications.map((n: any) => (
                <li key={n._id}
                  className={cn("flex items-start gap-3.5 px-5 py-4 transition-colors", !n.isRead && "bg-primary-soft/35")}>
                  {n.sender ? (
                    <Avatar name={n.sender.name} src={n.sender.profileImage} size="sm" />
                  ) : (
                    <span className="grid place-items-center h-9 w-9 rounded-full bg-primary-soft text-primary shrink-0">
                      <Bell size={15} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-ink leading-snug">{n.message}</p>
                    <p className="text-[12px] text-muted-2 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
