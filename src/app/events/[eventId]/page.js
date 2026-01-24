"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api";
import useAuthStore from "@/store/authStore";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Save,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const eventId = params.eventId;

  const [event, setEvent] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [domainMembers, setDomainMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    excused: 0,
  });

  // Track changes for bulk update
  const [attendanceChanges, setAttendanceChanges] = useState({});

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);

      // First get the event to know which domain it belongs to
      const eventRes = await apiClient.get(`/events/${eventId}`);
      const eventData = eventRes.data.event;
      setEvent(eventData);

      // Determine which domain to fetch members from
      const targetDomainId = eventData.domainId || user.domainId;

      // Fetch attendance records and domain members in parallel
      const [attendanceRes, membersRes] = await Promise.all([
        apiClient.get(`/attendance?eventId=${eventId}`),
        // Only fetch USER role members from the target domain
        apiClient.get(`/users?domainId=${targetDomainId}&role=USER`),
      ]);

      const attendanceData = attendanceRes.data.attendances || [];
      const membersData = membersRes.data.users || [];

      setAttendanceRecords(attendanceData);
      setDomainMembers(membersData);

      // Calculate stats based on domain members
      const present = attendanceData.filter(
        (a) => a.status === "PRESENT"
      ).length;
      const absent = attendanceData.filter((a) => a.status === "ABSENT").length;
      const excused = attendanceData.filter(
        (a) => a.status === "EXCUSED"
      ).length;

      setStats({
        total: membersData.length, // Total domain members, not attendance records
        present,
        absent,
        excused,
      });
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    setAttendanceChanges((prev) => ({
      ...prev,
      [userId]: newStatus,
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);

      const attendancesToUpdate = Object.entries(attendanceChanges).map(
        ([userId, status]) => ({
          userId,
          status,
        })
      );

      if (attendancesToUpdate.length === 0) {
        toast.info("No changes to save");
        return;
      }

      await apiClient.post("/attendance", {
        eventId,
        attendances: attendancesToUpdate,
      });

      toast.success("Attendance saved successfully!");
      setAttendanceChanges({});
      fetchEventDetails();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(error.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "ABSENT":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "EXCUSED":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      OPEN: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      CLOSED:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };

    return (
      <span
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          variants[status]
        )}
      >
        {status}
      </span>
    );
  };

  const getCurrentStatus = (userId) => {
    // Check if there's a pending change
    if (attendanceChanges[userId]) {
      return attendanceChanges[userId];
    }

    // Check existing attendance record
    const record = attendanceRecords.find((r) => r.userId === userId);
    return record?.status || "ABSENT";
  };

  const filteredMembers = domainMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.roll.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-500">Loading...</div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-500">Event not found</div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {event.title}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.date), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event.domain?.name || "General"}</span>
                  </div>
                </div>
              </div>
              <div>{getStatusBadge(event.status)}</div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Members
                </CardTitle>
                <Users className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.present}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.absent}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Excused</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.excused}</div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Marking */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mark Attendance</CardTitle>
                  <CardDescription>
                    Update attendance status for domain members
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSaveAttendance}
                  disabled={
                    saving ||
                    Object.keys(attendanceChanges).length === 0 ||
                    event.status === "CLOSED"
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes ({Object.keys(attendanceChanges).length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Attendance List */}
              <div className="space-y-2">
                {filteredMembers.length === 0 ? (
                  <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    No members found
                  </p>
                ) : (
                  filteredMembers.map((member) => {
                    const currentStatus = getCurrentStatus(member.id);
                    const hasChanges =
                      attendanceChanges[member.id] !== undefined;

                    return (
                      <div
                        key={member.id}
                        className={cn(
                          "flex items-center justify-between p-4 border rounded-lg transition-colors",
                          hasChanges
                            ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(currentStatus)}
                          <div>
                            <h3 className="font-medium">{member.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {member.email} • {member.roll}
                            </p>
                          </div>
                        </div>

                        <Select
                          value={currentStatus}
                          onValueChange={(value) =>
                            handleStatusChange(member.id, value)
                          }
                          disabled={event.status === "CLOSED"}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESENT">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Present
                              </div>
                            </SelectItem>
                            <SelectItem value="ABSENT">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                                Absent
                              </div>
                            </SelectItem>
                            <SelectItem value="EXCUSED">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                                Excused
                              </div>
                            </SelectItem>
                            <SelectItem value="NOT_APPLICABLE">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-400" />
                                Not Applicable
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
