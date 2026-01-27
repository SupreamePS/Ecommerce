"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Search, Trash2, Calendar as CalendarIcon, Clock, MapPin, Users, Phone, Mail, User, Grid, List as ListIcon, ChevronLeft, ChevronRight, Download, Columns, ArrowUpDown, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addHours, isBefore, isAfter } from "date-fns";

// Types
type Reservation = {
    id: string;
    timestamp: string;
    branch: string;
    branch_id: number;
    date: string;
    time: string;
    end_time?: string;
    guests: string;
    name: string;
    phone: string;
    email: string;
    status: string;
    table_number?: string;
};

type Table = {
    id: number;
    branch_id: number;
    table_number: string;
    capacity_min: number;
    capacity_max: number;
};

type Branch = {
    id: number;
    name: string;
    address: string;
};

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"calendar" | "week" | "list">("calendar");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selectedBranch, setSelectedBranch] = useState<"all" | "liabduan" | "rama9">("all");

    // Booking Modal State
    // Booking Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingForm, setBookingForm] = useState({
        branch_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "",
        guests: "2",
        name: "",
        phone: "",
        email: "",
        table_number: ""
    });
    const [adminAvailableTimes, setAdminAvailableTimes] = useState<string[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isFetchingAvailability, setIsFetchingAvailability] = useState(false);
    const [isTablesLoading, setIsTablesLoading] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Reservation | null>(null);
    const [editForm, setEditForm] = useState({
        table_number: "",
        status: "",
        date: "",
        time: "",
        end_time: "",
        guests: ""
    });

    // Loading states
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);

    // Check session on mount
    useEffect(() => {
        const auth = sessionStorage.getItem("admin_auth");
        if (auth === "true") {
            setIsAuthenticated(true);
            loadReservations();
        } else {
            router.push("/admin/login");
        }
    }, [router]);

    useEffect(() => {
        // Fetch branches
        fetch('/api/branches')
            .then(res => res.json())
            .then(data => {
                setBranches(data);
                // Set default booking branch if loaded
                if (data.length > 0) {
                    setBookingForm(prev => ({ ...prev, branch_id: data[0].id.toString() }));
                }
            })
            .catch(err => console.error(err));
    }, []);

    const loadReservations = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                setReservations(data);
            }
        } catch (error) {
            console.error("Failed to load reservations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Admin Booking Logic
    useEffect(() => {
        if (isBookingModalOpen && bookingForm.branch_id) {
            fetchTables(parseInt(bookingForm.branch_id));
        }
    }, [isBookingModalOpen, bookingForm.branch_id]);

    useEffect(() => {
        // Fetch availability when basic params change
        const fetchAvail = async () => {
            if (!bookingForm.date || !bookingForm.branch_id || !bookingForm.guests) return;
            setIsFetchingAvailability(true);
            try {
                const params = new URLSearchParams({
                    date: bookingForm.date,
                    branch_id: bookingForm.branch_id, // Use ID
                    guests: bookingForm.guests
                });
                const res = await fetch(`/api/availability?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setAdminAvailableTimes(data.availableSlots || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsFetchingAvailability(false);
            }
        };
        const timer = setTimeout(fetchAvail, 300);
        return () => clearTimeout(timer);
    }, [bookingForm.date, bookingForm.branch_id, bookingForm.guests]);

    const fetchTables = async (branchId: number) => {
        setIsTablesLoading(true);
        try {
            const res = await fetch(`/api/tables?branch=${branchId}`);
            if (res.ok) {
                const data = await res.json();
                setTables(data);
            }
        } catch (error) {
            console.error("Failed to fetch tables", error);
            setTables([]);
        } finally {
            setIsTablesLoading(false);
        }
    };

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingForm)
            });
            if (res.ok) {
                alert("Booking created successfully!");
                setIsBookingModalOpen(false);
                loadReservations();
                // Reset form
                setBookingForm({
                    branch_id: branches.length > 0 ? branches[0].id.toString() : "",
                    date: format(new Date(), "yyyy-MM-dd"),
                    time: "",
                    guests: "2",
                    name: "",
                    phone: "",
                    email: "",
                    table_number: ""
                });
            } else {
                alert("Failed to create booking");
            }
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this booking?")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                loadReservations();
            } else {
                alert("Failed to delete booking");
            }
        } catch (error) {
            console.error("Error deleting booking:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (booking: Reservation) => {
        if (booking.status === 'completed') return;
        setEditingBooking(booking);
        setEditForm({
            table_number: booking.table_number || "",
            status: booking.status,
            date: booking.date,
            time: booking.time,
            end_time: booking.end_time || "",
            guests: booking.guests.toString()
        });
        setIsEditModalOpen(true);
        // Force refresh tables to check current DB status
        if (booking.branch_id) fetchTables(booking.branch_id);
    };

    const handleFinishBooking = async () => {
        if (!editingBooking) return;
        if (!confirm("Are you sure? This will update end time to NOW and free up the table.")) return;

        const now = new Date();
        const endTimeStr = format(now, 'HH:mm');

        setIsFinishing(true);
        try {
            // We use PATCH passing end_time
            const res = await fetch(`/api/bookings/${editingBooking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ end_time: endTimeStr, status: 'completed' })
            });

            if (res.ok) {
                alert("Booking finished and table freed!");
                setIsEditModalOpen(false);
                setEditingBooking(null);
                loadReservations();
            } else {
                alert("Failed");
            }
        } catch (error) {
            console.error("Error finishing booking:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsFinishing(false);
        }
    };

    const handleUpdateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBooking) return;

        setIsUpdating(true);
        try {
            // Prepare update data - if booking is pending and being updated, change to confirmed
            const updateData = {
                ...editForm,
                // Auto-confirm if currently pending and we're making changes
                status: editingBooking.status === 'pending' ? 'confirmed' : editForm.status
            };

            const res = await fetch(`/api/bookings/${editingBooking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                alert("Booking updated!");
                setIsEditModalOpen(false);
                setEditingBooking(null);
                loadReservations();
            } else {
                alert("Failed to update booking");
            }
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("admin_auth");
        router.push("/admin/login");
    };

    // Stats Logic
    const stats = useMemo(() => {
        const getBranchStats = (branch: string) => {
            const branchRes = reservations.filter(r => r.branch === branch);
            return {
                total: branchRes.length,
                pending: branchRes.filter(r => r.status === 'pending' || !r.table_number).length,
                confirmed: branchRes.filter(r => r.status === 'confirmed').length
            };
        };

        return {
            liabduan: getBranchStats('liabduan'),
            rama9: getBranchStats('rama9')
        };
    }, [reservations]);

    // Calendar Days Logic (Month View)
    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    // Weekly Days Logic (Week View)
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    // Filter Logic
    const filteredReservations = useMemo(() => {
        let filtered = reservations;

        // Branch Filter
        if (selectedBranch !== 'all') {
            // selectedBranch handles "all" or specific name logic, but now we have IDs.
            // Let's adapt selectedBranch to accept "all" | string (name or id?).
            // Existing code uses 'liabduan'/'rama9' strings.
            // If we want to strictly filter by ID, we should change selectedBranch type.
            // But 'reservations' come with 'branch' name string (from API join) AND 'branch_id'.
            // Simplest: Filter by branch name string if selectedBranch matches name, OR switch to ID.
            // Let's stick to name for UI filter if `reservation` has `branch` name.
            filtered = filtered.filter(r => r.branch === selectedBranch);
        }

        // Date Filter (from select/click)
        if (selectedDate) {
            filtered = filtered.filter(r => isSameDay(parseISO(r.date), selectedDate));
        }

        // Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                r.phone.includes(q)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        });

        return filtered;
    }, [selectedDate, reservations, searchQuery, sortOrder, selectedBranch]);

    // Heatmap Logic using Filtered Reservations (to respect branch)
    const maxBookingsInView = useMemo(() => {
        const daysToCheck = viewMode === "week" ? weekDays : calendarDays;
        let max = 0;
        daysToCheck.forEach(day => {
            const count = filteredReservations.filter(r => isSameDay(parseISO(r.date), day)).length;
            if (count > max) max = count;
        });
        return max > 0 ? max : 1;
    }, [viewMode, weekDays, calendarDays, filteredReservations]);

    const getHeatmapColor = (count: number) => {
        if (count === 0) return "bg-neutral-900";
        const intensity = Math.min(count / maxBookingsInView, 1);
        return {
            backgroundColor: `rgba(220, 38, 38, ${Math.max(0.1, intensity * 0.6)})`, // Red with dynamic opacity
            borderColor: `rgba(220, 38, 38, ${Math.max(0.2, intensity)})`
        };
    };

    const getBookingsForDate = (date: Date) => {
        return filteredReservations.filter(r => isSameDay(parseISO(r.date), date));
    };

    const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    // Handlers
    const nextPeriod = () => {
        if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addMonths(currentDate, 1));
    };
    const prevPeriod = () => {
        if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subMonths(currentDate, 1));
    };
    const handleDateClick = (date: Date) => {
        setSelectedDate(isSameDay(date, selectedDate || new Date(0)) ? null : date);
        setViewMode("list"); // Switch to list to see details
    };

    // Helper function for table availability checking
    const getOccupiedTables = (checkBranchId: string | number, checkDate: string, checkTime: string, excludeBookingId?: string) => {
        if (!checkBranchId || !checkDate || !checkTime) return [];

        const startA = parseISO(`${checkDate}T${checkTime}`);
        const endA = addHours(startA, 1);

        const overlapping = reservations.filter(r => {
            if (excludeBookingId && r.id === excludeBookingId) return false;
            // Strict branch check - ensure types match (string vs number)
            if (r.branch_id?.toString() !== checkBranchId.toString()) return false;
            if (r.date !== checkDate) return false;
            if (r.status === 'cancelled' || r.status === 'completed') return false; // Ignore completed/cancelled

            // Calculate r end time
            let endB = addHours(parseISO(`${r.date}T${r.time}`), 1);
            if (r.end_time) {
                // If end_time is HH:mm
                endB = parseISO(`${r.date}T${r.end_time}`);
            }
            const startB = parseISO(`${r.date}T${r.time}`);

            // Overlap check
            // (StartA < EndB) and (EndA > StartB)
            return isBefore(startA, endB) && isAfter(endA, startB);
        });

        // Collect all occupied table numbers
        const occupied = new Set<string>();
        overlapping.forEach(r => {
            if (r.table_number) {
                r.table_number.split(',').forEach(t => occupied.add(t.trim()));
            }
        });

        return Array.from(occupied);
    };

    // Calculate occupied tables for New Booking form
    const newBookingOccupiedTables = useMemo(() => {
        return getOccupiedTables(bookingForm.branch_id, bookingForm.date, bookingForm.time);
    }, [bookingForm.branch_id, bookingForm.date, bookingForm.time, reservations]);


    if (isLoading || !isAuthenticated) return null;

    // DASHBOARD VIEW
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-foreground p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Reservations</h1>
                        <p className="text-neutral-400">Manage incoming table bookings</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors text-sm font-medium"
                        >
                            Logout
                        </button>
                        <button
                            onClick={() => setIsBookingModalOpen(true)}
                            className="px-4 py-2 bg-primary text-black rounded-full hover:bg-white transition-colors text-sm font-bold flex items-center gap-2"
                        >
                            <Plus size={16} />
                            New Booking
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Liabduan Stats */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Liabduan Branch</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-3xl font-bold text-white">{stats.liabduan.total}</div>
                                <div className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">Total</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-yellow-500">{stats.liabduan.pending}</div>
                                <div className="text-xs text-yellow-500/70 mt-1 uppercase tracking-wider">Pending</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-green-500">{stats.liabduan.confirmed}</div>
                                <div className="text-xs text-green-500/70 mt-1 uppercase tracking-wider">Confirmed</div>
                            </div>
                        </div>
                    </div>

                    {/* Rama 9 Stats */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 relative overflow-hidden group">

                        <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Rama 9 Branch</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-3xl font-bold text-white">{stats.rama9.total}</div>
                                <div className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">Total</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-yellow-500">{stats.rama9.pending}</div>
                                <div className="text-xs text-yellow-500/70 mt-1 uppercase tracking-wider">Pending</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-green-500">{stats.rama9.confirmed}</div>
                                <div className="text-xs text-green-500/70 mt-1 uppercase tracking-wider">Confirmed</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-4 items-center w-full">

                        {/* Branch Filter */}
                        {/* Branch Filter */}
                        <div className="flex bg-neutral-900/50 border border-white/10 p-1 rounded-lg w-fit shrink-0">
                            <button
                                onClick={() => setSelectedBranch('all')}
                                className={cn(
                                    "px-4 py-2 rounded-md transition-all text-sm font-medium capitalize",
                                    selectedBranch === 'all' ? "bg-primary text-black shadow-lg" : "text-neutral-400 hover:text-white"
                                )}
                            >
                                All Branches
                            </button>
                            {branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    onClick={() => setSelectedBranch(branch.name as any)}
                                    className={cn(
                                        "px-4 py-2 rounded-md transition-all text-sm font-medium capitalize",
                                        selectedBranch === branch.name
                                            ? "bg-primary text-black shadow-lg"
                                            : "text-neutral-400 hover:text-white"
                                    )}
                                >
                                    {branch.name}
                                </button>
                            ))}
                        </div>

                        <div className="h-8 w-px bg-white/10 hidden md:block" />
                        <div className="flex bg-neutral-900/50 border border-white/10 p-1 rounded-lg w-fit shrink-0">
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium",
                                    viewMode === "calendar" ? "bg-white/10 text-white shadow-lg" : "text-neutral-400 hover:text-white"
                                )}
                            >
                                <CalendarIcon size={16} />
                                Month
                            </button>
                            <button
                                onClick={() => setViewMode("week")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium",
                                    viewMode === "week" ? "bg-white/10 text-white shadow-lg" : "text-neutral-400 hover:text-white"
                                )}
                            >
                                <Columns size={16} />
                                Week
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium",
                                    viewMode === "list" ? "bg-white/10 text-white shadow-lg" : "text-neutral-400 hover:text-white"
                                )}
                            >
                                <ListIcon size={16} />
                                List
                            </button>
                        </div>

                        {(viewMode === "calendar" || viewMode === "week") && (
                            <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/10 px-4 py-2 rounded-lg">
                                <button onClick={prevPeriod} className="text-neutral-400 hover:text-white transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-white font-medium min-w-[120px] text-center">
                                    {viewMode === 'calendar' ? format(currentDate, "MMMM yyyy") : `Week of ${format(startOfWeek(currentDate), "MMM d")}`}
                                </span>
                                <button onClick={nextPeriod} className="text-neutral-400 hover:text-white transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* List View Controls (Search & Sort) */}
                        {viewMode === 'list' && (
                            <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search name, phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-neutral-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <button
                                    onClick={toggleSort}
                                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900/50 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors text-sm"
                                >
                                    <ArrowUpDown size={16} />
                                    {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
                                </button>
                                {selectedDate && (
                                    <div className="flex items-center gap-2 text-white bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg text-sm shrink-0">
                                        <span>{format(selectedDate, "MMM dd")}</span>
                                        <button onClick={() => setSelectedDate(null)} className="hover:text-primary transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {viewMode === "calendar" && (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6"
                        >
                            <div className="grid grid-cols-7 gap-px bg-white/10 rounded-lg overflow-hidden border border-white/10">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="bg-neutral-900 p-4 text-center text-sm font-medium text-neutral-500">
                                        {day}
                                    </div>
                                ))}
                                {calendarDays.map((day, i) => {
                                    const bookings = getBookingsForDate(day);
                                    const isCurrentMonth = isSameMonth(day, currentDate);
                                    const isTodayDate = isToday(day);
                                    const hasBookings = bookings.length > 0;
                                    const heatmapStyle = hasBookings ? getHeatmapColor(bookings.length) : {};

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => handleDateClick(day)}
                                            style={heatmapStyle}
                                            className={cn(
                                                "bg-neutral-900 min-h-[120px] p-3 transition-colors cursor-pointer hover:brightness-110",
                                                !isCurrentMonth && "opacity-30 pointer-events-none"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={cn(
                                                    "w-7 h-7 flex items-center justify-center rounded-full text-sm",
                                                    isTodayDate ? "bg-white text-black font-bold" : "text-neutral-400"
                                                )}>
                                                    {format(day, 'd')}
                                                </span>
                                                {hasBookings && (
                                                    <span className="text-xs font-medium text-white bg-black/40 px-2 py-0.5 rounded-full">
                                                        {bookings.length}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                {bookings.slice(0, 3).map(booking => (
                                                    <div key={booking.id} className="text-[10px] truncate bg-black/40 text-white px-1.5 py-0.5 rounded border border-white/10">
                                                        {booking.time} - {booking.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {viewMode === "week" && (
                        <motion.div
                            key="week"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6 overflow-x-auto"
                        >
                            <div className="grid grid-cols-7 gap-4 min-w-[800px]">
                                {weekDays.map((day, i) => {
                                    const bookings = getBookingsForDate(day);
                                    const isTodayDate = isToday(day);
                                    const heatmapStyle = bookings.length > 0 ? getHeatmapColor(bookings.length) : {};

                                    return (
                                        <div key={i} className="flex flex-col gap-3">
                                            {/* Header Card */}
                                            <div
                                                style={heatmapStyle}
                                                onClick={() => handleDateClick(day)}
                                                className={cn(
                                                    "p-4 rounded-xl border border-white/10 text-center cursor-pointer transition-transform hover:scale-[1.02]",
                                                    "bg-neutral-900" // Fallback bg is handled by style
                                                )}
                                            >
                                                <div className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-1">
                                                    {format(day, 'EEE')}
                                                </div>
                                                <div className={cn(
                                                    "text-2xl font-bold",
                                                    isTodayDate ? "text-white" : "text-neutral-200"
                                                )}>
                                                    {format(day, 'd')}
                                                </div>
                                                <div className="mt-2 text-xs font-semibold bg-black/30 text-white py-1 px-2 rounded-lg inline-block">
                                                    {bookings.length} Bookings
                                                </div>
                                            </div>

                                            {/* Scrollable list of bookings for the day */}
                                            <div className="space-y-2 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {bookings.map(booking => (
                                                    <div key={booking.id} className="bg-neutral-900 border border-white/10 p-3 rounded-lg text-sm hover:border-primary/50 transition-colors">
                                                        <div className="flex items-center gap-2 mb-2 text-xs font-mono text-primary">
                                                            <Clock size={12} />
                                                            {booking.time}
                                                        </div>
                                                        <div className="font-semibold text-white truncate">{booking.name}</div>
                                                        <div className="flex items-center gap-2 text-neutral-500 text-xs mt-1">
                                                            <Users size={12} />
                                                            {booking.guests} Guests
                                                        </div>
                                                        <div className="flex items-center gap-2 text-neutral-500 text-xs mt-1">
                                                            <span className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                booking.status === 'confirmed' ? "bg-green-500" :
                                                                    booking.status === 'cancelled' ? "bg-red-500" :
                                                                        "bg-yellow-500"
                                                            )} />
                                                            {booking.status}
                                                        </div>
                                                    </div>
                                                ))}
                                                {bookings.length === 0 && (
                                                    <div className="text-center text-neutral-600 text-xs py-4 italic">
                                                        No bookings
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {viewMode === "list" && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-neutral-900/30 border border-white/5 rounded-2xl overflow-hidden"
                        >
                            {filteredReservations.length === 0 ? (
                                <div className="p-12 text-center text-neutral-500">
                                    No reservations found matching your criteria.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 text-neutral-400 text-sm uppercase tracking-wider">
                                            <tr>
                                                <th className="p-6 font-medium">Status</th>
                                                <th className="p-6 font-medium">Customer</th>
                                                <th className="p-6 font-medium">Branch</th>
                                                <th className="p-6 font-medium">Table</th>
                                                <th className="p-6 font-medium">Date & Time</th>
                                                <th className="p-6 font-medium">Contact</th>
                                                <th className="p-6 font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredReservations.map((res) => (
                                                <tr
                                                    key={res.id}
                                                    className="hover:bg-white/5 transition-colors cursor-pointer"
                                                    onClick={() => handleEditClick(res)}
                                                >
                                                    <td className="p-6">
                                                        <span className={cn(
                                                            "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                                            res.status === 'confirmed' ? "bg-green-500/20 text-green-400" :
                                                                res.status === 'cancelled' ? "bg-red-500/20 text-red-400" :
                                                                    "bg-yellow-500/20 text-yellow-400"
                                                        )}>
                                                            {res.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                                                <User size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-white">{res.name}</div>
                                                                <div className="text-sm text-neutral-500">{res.guests} Guests</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-2 text-neutral-300">
                                                            <MapPin size={16} className="text-primary" />
                                                            <span className="capitalize">{res.branch}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        {res.table_number ? (
                                                            <div className="inline-flex gap-1 flex-wrap">
                                                                {res.table_number.split(',').map(t => (
                                                                    <span key={t} className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold border border-primary/20">
                                                                        {t}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-neutral-600 text-xs italic">Pending</span>
                                                        )}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-white">
                                                                <CalendarIcon size={16} className="text-neutral-500" />
                                                                {new Date(res.date).toLocaleDateString()}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-white">
                                                                <Clock size={16} className="text-neutral-500" />
                                                                {res.time}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex items-center gap-2 text-neutral-400">
                                                                <Phone size={14} />
                                                                {res.phone}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-neutral-400">
                                                                <Mail size={14} />
                                                                {res.email}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent row click
                                                                handleDelete(res.id);
                                                            }}
                                                            className="text-neutral-500 hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-lg"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Booking Modal */}
            <AnimatePresence>
                {isBookingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-neutral-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
                                <h2 className="text-xl font-bold text-white">New Reservation</h2>
                                <button onClick={() => setIsBookingModalOpen(false)} className="text-neutral-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateBooking} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Branch</label>
                                        <select
                                            value={bookingForm.branch_id}
                                            onChange={e => setBookingForm({ ...bookingForm, branch_id: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white appearance-none"
                                        >
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Date</label>
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={bookingForm.date}
                                            onChange={e => {
                                                const selectedDate = new Date(e.target.value);
                                                if (selectedDate.getDay() === 1) { // 1 is Monday
                                                    alert("Restaurant is closed on Mondays.");
                                                    setBookingForm({ ...bookingForm, date: "" });
                                                } else {
                                                    setBookingForm({ ...bookingForm, date: e.target.value });
                                                }
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Guests</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            required
                                            value={bookingForm.guests}
                                            onChange={e => setBookingForm({ ...bookingForm, guests: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white"
                                            placeholder="Number of guests"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Time</label>
                                        <select
                                            value={bookingForm.time}
                                            required
                                            disabled={isFetchingAvailability || adminAvailableTimes.length === 0}
                                            onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white appearance-none disabled:opacity-50"
                                        >
                                            <option value="" disabled>Select Time</option>
                                            {adminAvailableTimes.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="text-sm font-bold text-white mb-4">Customer Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-neutral-400 mb-2">Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Customer Name"
                                                value={bookingForm.name}
                                                onChange={e => setBookingForm({ ...bookingForm, name: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-400 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="Phone Number"
                                                value={bookingForm.phone}
                                                onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
                                            <input
                                                type="email"
                                                placeholder="Email (Optional)"
                                                value={bookingForm.email}
                                                onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="text-sm font-bold text-white mb-4">Table Allocation</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Assign Table (Optional)</label>
                                        <select
                                            value={bookingForm.table_number}
                                            onChange={e => setBookingForm({ ...bookingForm, table_number: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white appearance-none"
                                        >
                                            <option value="">Auto-Decide / Pending</option>
                                            {tables.map(table => {
                                                const isOccupied = newBookingOccupiedTables.includes(table.table_number.toString());
                                                return (
                                                    <option
                                                        key={table.id}
                                                        value={table.table_number}
                                                        disabled={isOccupied}
                                                        className={isOccupied ? "text-red-500 bg-neutral-900" : ""}
                                                    >
                                                        {table.table_number} ({table.capacity_min}-{table.capacity_max} pax) {isOccupied ? "(Occupied)" : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <p className="text-xs text-neutral-500 mt-2">
                                            Leave blank to let functionality decide or mark as pending if complex.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsBookingModalOpen(false)}
                                        className="flex-1 px-6 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-1 px-6 py-3 bg-primary text-black rounded-xl font-bold hover:bg-white transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Creating...
                                            </>
                                        ) : (
                                            "Confirm Booking"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md"
                        >
                            <div className="sticky top-0 bg-neutral-900 border-b border-white/10 p-6 flex items-center justify-between z-10 rounded-t-2xl">
                                <h2 className="text-xl font-bold text-white">Edit Booking</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-neutral-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateBooking} className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-white font-semibold mb-1">{editingBooking.name}</h3>
                                    <p className="text-neutral-400 text-sm">
                                        {format(parseISO(editingBooking.date), 'PPP')} at {editingBooking.time} ({editingBooking.guests} guests)
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Date</label>
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={editForm.date}
                                            onChange={e => {
                                                const selectedDate = new Date(e.target.value);
                                                if (selectedDate.getDay() === 1) { // 1 is Monday
                                                    alert("Restaurant is closed on Mondays.");
                                                    setEditForm({ ...editForm, date: "" });
                                                } else {
                                                    setEditForm({ ...editForm, date: e.target.value });
                                                }
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Time</label>
                                        <input
                                            type="time"
                                            value={editForm.time}
                                            onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white"
                                        />
                                        <p className="text-xs text-neutral-500 mt-1">
                                            Changing time will automatically update end time (1 hr duration).
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Guests</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            required
                                            value={editForm.guests}
                                            onChange={e => setEditForm({ ...editForm, guests: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white"
                                            placeholder="Guest count"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-2">Select Table(s)</label>
                                    <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1 relative">
                                        {isTablesLoading && (
                                            <div className="absolute inset-0 bg-neutral-900/80 flex items-center justify-center z-10 backdrop-blur-sm">
                                                <div className="text-primary text-sm font-medium animate-pulse">Checking Availability...</div>
                                            </div>
                                        )}
                                        {tables.sort((a, b) => parseInt(a.table_number) - parseInt(b.table_number)).map(table => {
                                            const currentSelections = editForm.table_number ? editForm.table_number.split(',').map(s => s.trim()) : [];
                                            const isSelected = currentSelections.includes(table.table_number.toString());

                                            // Use shared availability check function with editForm values
                                            const checkTime = editForm.time || '';
                                            const checkDate = editForm.date || '';
                                            const checkBranchId = editingBooking?.branch_id?.toString() || '';

                                            const occupiedTables = getOccupiedTables(checkBranchId, checkDate, checkTime, editingBooking?.id);
                                            const isOccupied = occupiedTables.includes(table.table_number.toString());
                                            const isDisabled = isOccupied;

                                            // Handle Toggle
                                            const toggleTable = (tNum: string) => {
                                                if (isDisabled) return;
                                                let newSelections = [...currentSelections];
                                                if (isSelected) {
                                                    newSelections = newSelections.filter(s => s !== tNum);
                                                } else {
                                                    newSelections.push(tNum);
                                                }
                                                // Join and set
                                                setEditForm({ ...editForm, table_number: newSelections.join(',') });
                                            };

                                            return (
                                                <button
                                                    key={table.id}
                                                    type="button"
                                                    onClick={() => toggleTable(table.table_number.toString())}
                                                    disabled={isDisabled}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-sm font-bold transition-all relative",
                                                        isSelected
                                                            ? "bg-primary text-black border-primary shadow-lg shadow-primary/20"
                                                            : isDisabled
                                                                ? "bg-neutral-800 text-neutral-600 border-white/5 cursor-not-allowed opacity-50"
                                                                : "bg-white/5 text-white border-white/10 hover:border-primary/50 hover:bg-white/10"
                                                    )}
                                                >
                                                    {table.table_number}
                                                    <div className="text-[10px] font-normal opacity-70 mt-1">
                                                        {table.capacity_min}-{table.capacity_max}p
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Multi-select enabled. Red tables are occupied by other bookings at {editForm.time}.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 px-6 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFinishBooking}
                                        disabled={isFinishing}
                                        className="flex-1 px-4 py-3 bg-green-600/20 text-green-400 border border-green-600/50 rounded-xl font-bold hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isFinishing ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Finishing...
                                            </>
                                        ) : (
                                            "Finish & Free Table"
                                        )}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="flex-1 px-6 py-3 bg-primary text-black rounded-xl font-bold hover:bg-white transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Updating...
                                            </>
                                        ) : (
                                            "Update"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
