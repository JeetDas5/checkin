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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import {
  CalendarIcon,
  Plus,
  Users,
  Calendar as CalendarIconLucide,
  TrendingUp,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [domains, setDomains] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
  });
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsRes, domainsRes] = await Promise.all([
        apiClient.get("/events"),
        apiClient.get("/domains"),
      ]);

      const eventsData = eventsRes.data.events || [];
      const domainsData = domainsRes.data.domains || [];

      setEvents(eventsData);
      setDomains(domainsData);

      const now = new Date();
      const upcoming = eventsData.filter(
        (e) => new Date(e.date) > now && e.status === "OPEN"
      );

      setStats({
        totalEvents: eventsData.length,
        upcomingEvents: upcoming.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !time) {
      toast.error("Please fill in all fields");
      return;
    }

    const [hours, minutes] = time.split(":");
    const combinedDate = new Date(newEvent.date);
    combinedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // frontend validation
    const now = new Date();
    now.setSeconds(0, 0);
    if (combinedDate < now) {
      toast.error("Event time cannot be in the past");
      return;
    }

    try {
      await apiClient.post("/events", { ...newEvent, date: combinedDate });
      toast.success("Event created successfully!");
      setIsCreateDialogOpen(false);
      setNewEvent({ title: "", date: new Date() });
      setTime("10:00");
      fetchDashboardData();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(error.response?.data?.message || "Failed to create event");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex h-[50vh] w-full items-center justify-center">
              <Loader size="xl" text="Loading dashboard..." />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Events
                    </CardTitle>
                    <CalendarIconLucide className="h-4 w-4 text-slate-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalEvents}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Upcoming Events
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-slate-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.upcomingEvents}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Events Section */}
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Events</CardTitle>
                      <CardDescription>
                        Manage your attendance events
                      </CardDescription>
                    </div>
                    <Dialog
                      open={isCreateDialogOpen}
                      onOpenChange={setIsCreateDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Event</DialogTitle>
                          <DialogDescription>
                            Add a new attendance event
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                              id="title"
                              placeholder="Weekly Meeting"
                              value={newEvent.title}
                              onChange={(e) =>
                                setNewEvent({
                                  ...newEvent,
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="flex gap-4">
                            <div className="space-y-2 flex-1">
                              <Label>Date</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !newEvent.date && "text-slate-500"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {newEvent.date ? (
                                      format(newEvent.date, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={newEvent.date}
                                    onSelect={(date) =>
                                      setNewEvent({ ...newEvent, date })
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="space-y-2 w-32">
                              <Label htmlFor="time">Time</Label>
                              <Input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                              />
                            </div>
                          </div>
                          <Button
                            onClick={handleCreateEvent}
                            className="w-full"
                          >
                            Create Event
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                        No events yet. Create your first event!
                      </p>
                    ) : (
                      events.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <div>
                            <h3 className="font-medium">{event.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {format(new Date(event.date), "PPP")} •{" "}
                              {event.domain?.name || "GBM"}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={cn(
                                "px-2 py-1 text-xs font-medium rounded-full",
                                event.status === "OPEN"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              )}
                            >
                              {event.status}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/events/${event.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
