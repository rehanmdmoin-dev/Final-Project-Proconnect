"use client";
import { useEffect } from "react";
import { Users, UserCheck, UserX } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchConnections, fetchPendingRequests, respondToRequest } from "@/redux/slice/socialSlice";

export default function NetworkPage() {
  const dispatch = useAppDispatch();
  const { connections, pending } = useAppSelector((s) => s.social);

  useEffect(() => {
    dispatch(fetchConnections());
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  return (
    <>
      <Topbar
        title="Network"
        subtitle={connections.length ? `${connections.length} connection${connections.length === 1 ? "" : "s"}` : "People you're connected to"}
      />

      <div className="w-full px-5 lg:px-9 py-6 flex flex-col gap-6">
        {pending.length > 0 && (
          <section>
            <h2 className="font-display text-[16px] text-ink mb-3">
              Requests waiting on you
              <span className="num ml-2 rounded-full bg-primary text-white px-2 py-0.5 text-[11px]">{pending.length}</span>
            </h2>
            <div className="flex flex-col gap-3">
              {pending.map((r: any) => (
                <Card key={r._id} className="flex items-center gap-3.5 p-4">
                  <Avatar name={r.requester?.name || "?"} src={r.requester?.profileImage} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-medium text-ink truncate">{r.requester?.name}</p>
                    <p className="text-[12.5px] text-muted truncate">{r.requester?.headline || r.requester?.location}</p>
                  </div>
                  <Button size="sm" onClick={() => dispatch(respondToRequest({ id: r._id, accept: true }))}>
                    <UserCheck size={14} /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dispatch(respondToRequest({ id: r._id, accept: false }))}>
                    <UserX size={14} /> Decline
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-[16px] text-ink mb-3">Your connections</h2>
          {connections.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No connections yet"
                body="Connect with people you've worked with — you can message your connections directly."
              />
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {connections.map((c) => (
                <Card key={c.connectionId} className="flex items-center gap-3.5 p-4">
                  <Avatar name={c.user.name} src={c.user.profileImage} size="md" />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-ink truncate">{c.user.name}</p>
                    <p className="text-[12.5px] text-muted truncate">{c.user.headline || c.user.location || "—"}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
