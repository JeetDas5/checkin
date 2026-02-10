"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import apiClient from "@/lib/api";
import useAuthStore from "@/store/authStore";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    excused: 0,
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      if (!user || !user.id) {
        return;
      }

      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        const eventsResponse = await apiClient.get("/events");
        const eventsData = eventsResponse.data.events || [];

        const domainEvents =
          user.role === "ADMIN"
            ? eventsData.filter((e) => e.domainId === user.domainId)
            : eventsData;

        console.log("Admin Events Response:", eventsData);
        console.log("Domain Events:", domainEvents);

        setAttendanceRecords(domainEvents);

        const now = new Date();
        const upcoming = domainEvents.filter(
          (e) => new Date(e.date) > now && e.status === "OPEN"
        );
        const past = domainEvents.filter((e) => new Date(e.date) <= now);
        const closed = domainEvents.filter((e) => e.status === "CLOSED");

        setStats({
          total: domainEvents.length,
          present: upcoming.length,
          absent: past.length,
          excused: closed.length,
        });
      } else {
        const response = await apiClient.get(`/users/${user.id}/attendance`);
        const { attendances, stats: apiStats } = response.data;

        console.log("User Attendance API Response:", response.data);
        console.log("User Attendances:", attendances);
        console.log("User Stats:", apiStats);

        setAttendanceRecords(attendances || []);
        setStats({
          total: apiStats?.total || 0,
          present: apiStats?.present || 0,
          absent: apiStats?.absent || 0,
          excused: apiStats?.excused || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
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
      PRESENT:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      ABSENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      EXCUSED:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      NOT_APPLICABLE:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };

    return (
      <span
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          variants[status]
        )}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const attendancePercentage =
    stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex h-[50vh] w-full items-center justify-center">
              <Loader size="xl" text="Loading attendance..." />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                        ? "Total Events"
                        : "Attendance Rate"}
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-slate-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                        ? stats.total
                        : `${attendancePercentage}%`}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                        ? "in your domain"
                        : `${stats.present} of ${stats.total} events`}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                        ? "Upcoming"
                        : "Present"}
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.present}</div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                        ? "Past"
                        : "Absent"}
                    </CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.absent}</div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                        ? "Closed"
                        : "Excused"}
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.excused}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>
                    {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                      ? "View attendance records for all domain members"
                      : "View your attendance records for all events"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="present">
                        {user?.role === "USER" ? "Present" : "Upcoming"}
                      </TabsTrigger>
                      <TabsTrigger value="absent">
                        {user?.role === "USER" ? "Absent" : "Past"}
                      </TabsTrigger>
                      <TabsTrigger value="excused">
                        {user?.role === "USER" ? "Excused" : "Closed"}
                      </TabsTrigger>
                    </TabsList>

                    {["all", "present", "absent", "excused"].map((tab) => {
                      const filteredRecords = attendanceRecords.filter(
                        (record) => {
                          if (user?.role === "USER") {
                            return (
                              tab === "all" ||
                              record.status === tab.toUpperCase()
                            );
                          } else {
                            const now = new Date();
                            const recordDate = new Date(record.date);
                            if (tab === "all") return true;
                            if (tab === "present")
                              return (
                                recordDate > now && record.status === "OPEN"
                              );
                            if (tab === "absent") return recordDate <= now;
                            if (tab === "excused")
                              return record.status === "CLOSED";
                            return true;
                          }
                        }
                      );

                      return (
                        <TabsContent
                          key={tab}
                          value={tab}
                          className="space-y-4"
                        >
                          {filteredRecords.length === 0 ? (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                              {stats.total === 0
                                ? user?.role === "ADMIN" ||
                                  user?.role === "SUPER_ADMIN"
                                  ? "No events found for your domain. Create events to see them here."
                                  : "No attendance records yet. Your attendance will appear here once an admin marks it for events."
                                : "No records found"}
                            </p>
                          ) : (
                            filteredRecords.map((record) => (
                              <div
                                key={record.id}
                                className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                              >
                                <div className="flex items-center space-x-4">
                                  {user?.role === "USER" ? (
                                    getStatusIcon(record.status)
                                  ) : (
                                    <Calendar className="h-5 w-5 text-slate-500" />
                                  )}
                                  <div>
                                    <h3 className="font-medium">
                                      {user?.role === "USER"
                                        ? record.event?.title
                                        : record.title}
                                      {(user?.role === "ADMIN" ||
                                        user?.role === "SUPER_ADMIN") &&
                                        record.user && (
                                          <span className="ml-2 text-sm font-normal text-slate-600 dark:text-slate-400">
                                            • {record.user.name}
                                          </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      {format(
                                        new Date(
                                          user?.role === "USER"
                                            ? record.event?.date
                                            : record.date
                                        ),
                                        "PPP"
                                      )}{" "}
                                      •{" "}
                                      {user?.role === "USER"
                                        ? record.event?.domain?.name ||
                                          "General"
                                        : record.domain?.name || "General"}
                                      {(user?.role === "ADMIN" ||
                                        user?.role === "SUPER_ADMIN") &&
                                        record.user && (
                                          <span> • {record.user.roll}</span>
                                        )}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  {user?.role === "USER" ? (
                                    getStatusBadge(record.status)
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={cn(
                                          "px-2 py-1 text-xs font-medium rounded-full",
                                          record.status === "OPEN"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        )}
                                      >
                                        {record.status}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          router.push(`/events/${record.id}`)
                                        }
                                      >
                                        View
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
