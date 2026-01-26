"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, ArrowLeft, Mail, User as UserIcon } from "lucide-react";

export default function MembersPage() {
  const router = useRouter();
  const { user, getAuthHeader, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domainMembers, setDomainMembers] = useState(null);
  const [loadingDomain, setLoadingDomain] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Check if user has permission (ADMIN or SUPER_ADMIN)
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      router.push("/unauthorized");
      return;
    }

    fetchMembers();
  }, [user, isAuthenticated, router]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/members", {
        headers: {
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/unauthorized");
          return;
        }
        throw new Error("Failed to fetch members");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomainMembers = async (domainId) => {
    try {
      setLoadingDomain(true);
      const response = await fetch(`/api/members/${domainId}`, {
        headers: {
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch domain members");
      }

      const result = await response.json();
      setDomainMembers(result.members);
      setSelectedDomain(result.domain);
    } catch (error) {
      console.error("Error fetching domain members:", error);
    } finally {
      setLoadingDomain(false);
    }
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "USER":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    }
  };

  const handleBackToDomains = () => {
    setSelectedDomain(null);
    setDomainMembers(null);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Super Admin View - Domain List
  if (user?.role === "SUPER_ADMIN" && !selectedDomain) {
    return (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle>Domain Management</CardTitle>
                </div>
                <CardDescription>
                  Select a domain to view and manage its members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain Name</TableHead>
                      <TableHead>Total Members</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data?.length > 0 ? (
                      data.data.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">
                            {domain.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {domain.memberCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {new Date(domain.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => fetchDomainMembers(domain.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Members
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <p className="text-slate-500">No domains found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Super Admin View - Domain Members or Admin View - Own Domain Members
  const members =
    user?.role === "SUPER_ADMIN" ? domainMembers : data?.data || [];
  const domainName =
    user?.role === "SUPER_ADMIN"
      ? selectedDomain?.name
      : members[0]?.domain?.name || "Your Domain";

  if (loadingDomain) {
    return (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>{domainName} Members</CardTitle>
                    <CardDescription>
                      {members?.length || 0} member(s) in this domain
                    </CardDescription>
                  </div>
                </div>
                {user?.role === "SUPER_ADMIN" && selectedDomain && (
                  <Button variant="outline" onClick={handleBackToDomains}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Domains
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.length > 0 ? (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={member.profile_pic}
                                alt={member.name}
                              />
                              <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Mail className="h-4 w-4" />
                            {member.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <UserIcon className="h-4 w-4" />
                            {member.roll}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {member.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-slate-500">No members found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
