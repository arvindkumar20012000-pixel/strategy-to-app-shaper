import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, Shield, Crown, User, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  roles: string[];
}

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingRole, setAddingRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const roleMap: Record<string, string[]> = {};
      roles?.forEach((r) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });

      const merged = (profiles || []).map((p) => ({
        ...p,
        roles: roleMap[p.id] || [],
      }));

      setUsers(merged);
    } catch (error: any) {
      toast.error("Failed to load users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (userId: string, role: string) => {
    setAddingRole(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });

      if (error) throw error;
      toast.success(`Role "${role}" added successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to add role: " + error.message);
    } finally {
      setAddingRole(null);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);

      if (error) throw error;
      toast.success(`Role "${role}" removed`);
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to remove role: " + error.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    );
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="w-3 h-3" />;
      case "premium": return <Crown className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin": return "destructive";
      case "premium": return "default";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Manage Users</h2>
          <Badge variant="outline">{users.length} users</Badge>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name || "No name"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant={getRoleVariant(role)} className="gap-1">
                          {getRoleIcon(role)}
                          {role}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="ml-1 hover:text-foreground">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove role?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove "{role}" role from {user.full_name || user.email}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeRole(user.id, role)}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-sm text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      onValueChange={(role) => addRole(user.id, role)}
                      disabled={addingRole === user.id}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Add role" />
                      </SelectTrigger>
                      <SelectContent>
                        {["admin", "user", "premium"]
                          .filter((r) => !user.roles.includes(r))
                          .map((r) => (
                            <SelectItem key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
