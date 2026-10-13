"use client";
import { useCallback, useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api, { errText } from "@/api/axios";
import { ep } from "@/api/endpoints";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const { data } = await api.get(ep.admin.users, { params: { limit: 100 } });
      setUsers(data.data || []);
      setError("");
    } catch (cause) {
      setError(errText(cause, "Could not load users"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const mutate = async (user: UserRow, action: "status" | "verify" | "delete") => {
    if (action === "delete" && !window.confirm(`Delete ${user.name}'s account?`)) return;
    try {
      if (action === "status") await api.patch(ep.admin.userStatus(user._id));
      if (action === "verify") await api.patch(ep.admin.userVerify(user._id));
      if (action === "delete") await api.delete(ep.admin.userDelete(user._id));
      await loadUsers();
    } catch (cause) {
      setError(errText(cause, "Could not update this account"));
    }
  };

  return (
    <>
      <Topbar title="People" subtitle="Review and manage platform accounts" />
      <main className="w-full px-5 py-7 lg:px-9 full-width">
        {error && <p role="alert" className="mb-4 text-sm text-stage-rejected">{error}</p>}
        <Card className="overflow-hidden">
          {loading ? <p className="p-5 text-sm text-muted">Loading people...</p> : users.length === 0 ? <p className="p-5 text-sm text-muted">No accounts found.</p> :
            <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-line-soft text-[12px] uppercase text-muted"><tr><th className="px-4 py-3 font-medium">Person</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3 font-medium">Actions</th></tr></thead>
              <tbody className="divide-y divide-line-soft">{users.map((user) => <tr key={user._id}>
                <td className="px-4 py-3"><p className="font-medium text-ink">{user.name}</p><p className="text-xs text-muted">{user.email}</p></td>
                <td className="px-4 py-3 capitalize text-muted">{user.role}</td>
                <td className="px-4 py-3 text-muted">{user.status}{user.role === "recruiter" && user.isVerified ? " · Verified" : ""}</td>
                <td className="px-4 py-3 text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => void mutate(user, "status")}>{user.status === "blocked" ? "Unblock" : "Block"}</Button>
                  {user.role === "recruiter" && <Button size="sm" variant="secondary" onClick={() => void mutate(user, "verify")}>{user.isVerified ? "Unverify" : "Verify"}</Button>}
                  <Button size="sm" variant="danger" onClick={() => void mutate(user, "delete")}>Delete</Button>
                </div></td>
              </tr>)}</tbody>
            </table></div>}
        </Card>
      </main>
    </>
  );
}