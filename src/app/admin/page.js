"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import useAuthStore from "@/store/authStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import apiClient from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Pencil, ShieldCheck, UserCog, Plus, Search } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function AdminPanel() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [isCreateDomainOpen, setIsCreateDomainOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    domainId: "",
    role: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, domainsResponse] = await Promise.all([
        apiClient.get("/users"),
        apiClient.get("/domains"),
      ]);
      setUsers(usersResponse.data.users || []);
      setDomains(domainsResponse.data.domains || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load users or domains.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      domainId: user.domainId || "none",
      role: user.role,
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const payload = {
        name: formData.name,
        role: formData.role,
      };

      // Handle domainId logic
      if (formData.domainId === "none") {
        payload.domainId = null;
      } else {
        payload.domainId = formData.domainId;
      }

      const response = await apiClient.patch(
        `/users/${editingUser.id}`,
        payload
      );

      if (response.status === 200) {
        toast.success("Member updated successfully");
        setIsEditOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Update failed", error);
      toast.error(error.response?.data?.message || "Failed to update member");
    }
  };

  const handleCreateDomain = async () => {
    if (!newDomainName.trim()) {
      toast.error("Domain name is required");
      return;
    }

    try {
      const response = await apiClient.post("/domains", {
        name: newDomainName,
      });
      if (response.status === 201) {
        toast.success("Domain created successfully");
        setNewDomainName("");
        setIsCreateDomainOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Create domain failed", error);
      toast.error(error.response?.data?.message || "Failed to create domain");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.roll.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="container mx-auto py-10 px-4 md:px-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Admin Panel
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Manage members, domains, and roles.
              </p>
            </div>

            <Dialog
              open={isCreateDomainOpen}
              onOpenChange={setIsCreateDomainOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Domain
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Domain</DialogTitle>
                  <DialogDescription>
                    Add a new domain for organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="domain-name">Domain Name</Label>
                    <Input
                      id="domain-name"
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value)}
                      placeholder="e.g. Web Development"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsCreateDomainOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDomain}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name, email, or roll number..."
              className="pl-9 w-full md:w-[400px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader size="lg" text="Loading admin panel..." />
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className="truncate max-w-[150px]"
                              title={user.name}
                            >
                              {user.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono">
                          {user.roll}
                        </TableCell>
                        <TableCell>
                          {user.domain ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-secondary-foreground/10">
                              {user.domain.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm italic opacity-50">
                              None
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border shadow-sm
                          ${
                            user.role === "SUPER_ADMIN"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : user.role === "ADMIN"
                              ? "bg-secondary text-secondary-foreground border-secondary-foreground/10"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                          >
                            {user.role === "SUPER_ADMIN" && (
                              <ShieldCheck className="w-3 h-3" />
                            )}
                            {user.role.replace("_", " ").toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {currentUser?.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                              onClick={() => handleEditClick(user)}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Edit Member</DialogTitle>
                <DialogDescription>
                  Update member details and role. Email and Roll Number cannot
                  be changed.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none">
                    Full Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                    className="focus-visible:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium leading-none text-muted-foreground">
                      Email
                    </label>
                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 text-sm text-muted-foreground flex items-center overflow-hidden text-ellipsis whitespace-nowrap select-none cursor-not-allowed">
                      {editingUser?.email}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium leading-none text-muted-foreground">
                      Roll No.
                    </label>
                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 text-sm text-muted-foreground flex items-center select-none cursor-not-allowed">
                      {editingUser?.roll}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none">
                    Domain
                  </label>
                  <Select
                    value={
                      formData.domainId ? formData.domainId.toString() : "none"
                    }
                    onValueChange={(val) =>
                      setFormData({ ...formData, domainId: val })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {domains.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none flex items-center gap-2">
                    Role <UserCog className="w-4 h-4 text-primary" />
                  </label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) =>
                      setFormData({ ...formData, role: val })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  );
}
