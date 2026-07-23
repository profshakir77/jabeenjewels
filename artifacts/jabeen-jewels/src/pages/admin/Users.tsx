import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, UserPlus, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  createdAt: string;
}

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}api/admin/users`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

async function createUser(data: { username: string; password: string }): Promise<AdminUser> {
  const res = await fetch(`${import.meta.env.BASE_URL}api/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create user");
  return json;
}

async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${import.meta.env.BASE_URL}api/admin/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete user");
}

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: `User "${user.username}" created successfully` });
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User removed" });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
      setDeletingId(null);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    createMutation.mutate({ username: username.trim(), password });
  };

  const handleDelete = (id: number, uname: string) => {
    if (!window.confirm(`Remove user "${uname}"? This cannot be undone.`)) return;
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-8">
        <UsersIcon className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage who can log in to the admin panel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl">

        {/* User List */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-base">Current Users</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {users.length} {users.length === 1 ? "user" : "users"}
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">No users found</div>
            ) : (
              <ul className="divide-y divide-border">
                {users.map((user) => (
                  <li key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {user.email || "No email set"} · Added{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-PK", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleDelete(user.id, user.username)}
                      disabled={deletingId === user.id}
                      title="Remove user"
                    >
                      {deletingId === user.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Add User Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <UserPlus className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-base">Add New User</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="e.g. jabeen_admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                  : <><UserPlus className="mr-2 h-4 w-4" /> Create User</>}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              New users get full admin access. You cannot delete your own account.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
