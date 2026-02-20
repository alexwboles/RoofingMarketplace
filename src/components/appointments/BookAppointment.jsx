import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";

const DEFAULT_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
const DEFAULT_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const APPT_TYPES = [
  { value: "estimate", label: "Free Estimate" },
  { value: "inspection", label: "Roof Inspection" },
  { value: "follow_up", label: "Follow-up Visit" },
  { value: "project_start", label: "Project Start" },
];

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function getWeekDates(baseDate) {
  const start = startOfWeek(baseDate, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export default function BookAppointment({ rooferId, rooferCompany, quoteId, projectId, address, onBooked }) {
  const [availability, setAvailability] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [apptType, setApptType] = useState("estimate");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.RooferAvailability.filter({ roofer_id: rooferId }),
      base44.entities.Appointment.filter({ roofer_id: rooferId }),
    ]).then(([avail, appts]) => {
      setAvailability(avail[0] || { available_days: DEFAULT_DAYS, time_slots: DEFAULT_SLOTS, timezone: "America/New_York" });
      setAppointments(appts || []);
      setLoading(false);
    });
  }, [rooferId]);

  const availDays = availability?.available_days || DEFAULT_DAYS;
  const availSlots = availability?.time_slots || DEFAULT_SLOTS;
  const weekDates = getWeekDates(weekBase);

  const isDateAvailable = (date) => {
    const dayName = DAY_NAMES[date.getDay()];
    return availDays.includes(dayName) && date >= new Date(new Date().toDateString());
  };

  const getBookedSlots = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return appointments
      .filter((a) => a.date === dateStr && ["pending", "confirmed"].includes(a.status))
      .map((a) => a.time_slot);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) { toast.error("Please enter your name and email"); return; }
    setSubmitting(true);
    const appt = await base44.entities.Appointment.create({
      roofer_id: rooferId,
      roofer_company: rooferCompany,
      homeowner_name: form.name,
      homeowner_email: form.email,
      homeowner_phone: form.phone,
      address: address || "",
      date: format(selectedDate, "yyyy-MM-dd"),
      time_slot: selectedSlot,
      timezone: availability?.timezone || "America/New_York",
      type: apptType,
      status: "pending",
      notes: form.notes,
      quote_id: quoteId || "",
      project_id: projectId || "",
    });

    // Send confirmation email
    await base44.integrations.Core.SendEmail({
      to: form.email,
      subject: `Appointment Confirmed — ${rooferCompany}`,
      body: `Hi ${form.name},\n\nYour ${APPT_TYPES.find(t => t.value === apptType)?.label} appointment has been scheduled!\n\nDate: ${format(selectedDate, "EEEE, MMMM d, yyyy")}\nTime: ${selectedSlot} (${availability?.timezone || "America/New_York"})\nWith: ${rooferCompany}\n${address ? `Address: ${address}` : ""}\n\nYou'll receive a reminder 24 hours before your appointment.\n\nRoofQuoteAI Team`,
    });

    setSubmitting(false);
    setDone(true);
    toast.success("Appointment booked! Confirmation email sent.");
    onBooked?.(appt);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>;

  if (done) return (
    <div className="text-center py-8">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-slate-900">Appointment Booked!</h3>
      <p className="text-sm text-slate-500 mt-1">Check your email for confirmation.</p>
      <p className="text-sm font-semibold text-slate-700 mt-3">
        {format(selectedDate, "EEEE, MMMM d")} at {selectedSlot}
      </p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Type selector */}
      <div>
        <Label className="text-xs text-slate-500 mb-2 block">Appointment Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {APPT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setApptType(t.value)}
              className={`rounded-lg border p-2.5 text-sm font-medium transition-all text-left ${
                apptType === t.value
                  ? "bg-amber-50 border-amber-300 text-amber-800"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Week calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-xs text-slate-500">Select a Date</Label>
          <div className="flex gap-1">
            <button onClick={() => setWeekBase(addDays(weekBase, -7))} className="p-1 rounded hover:bg-slate-100">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-xs text-slate-500 self-center px-1">{format(weekDates[0], "MMM d")} – {format(weekDates[6], "MMM d")}</span>
            <button onClick={() => setWeekBase(addDays(weekBase, 7))} className="p-1 rounded hover:bg-slate-100">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, i) => {
            const avail = isDateAvailable(date);
            const selected = selectedDate && isSameDay(date, selectedDate);
            return (
              <button
                key={i}
                disabled={!avail}
                onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                className={`rounded-xl p-2 text-center transition-all flex flex-col items-center ${
                  selected ? "bg-amber-500 text-white"
                  : avail ? "bg-white border border-slate-200 hover:border-amber-300 text-slate-700"
                  : "bg-slate-50 text-slate-300 cursor-not-allowed"
                }`}
              >
                <span className="text-[10px] font-medium">{format(date, "EEE")}</span>
                <span className={`text-sm font-bold mt-0.5 ${isToday(date) && !selected ? "text-amber-500" : ""}`}>{format(date, "d")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <Label className="text-xs text-slate-500 mb-2 block">
            Available Times — {format(selectedDate, "EEEE, MMMM d")}
            <span className="ml-1 text-slate-400">({availability?.timezone || "ET"})</span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {availSlots.map((slot) => {
              const booked = getBookedSlots(selectedDate).includes(slot);
              const selected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  disabled={booked}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                    booked ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                    : selected ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white border-slate-200 text-slate-700 hover:border-amber-300"
                  }`}
                >
                  {booked ? "Booked" : slot}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact form */}
      {selectedDate && selectedSlot && (
        <div className="space-y-3 bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Contact Info</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" placeholder="Your name" />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Email *</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-sm" placeholder="you@email.com" type="email" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-sm" placeholder="(555) 000-0000" />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Notes (optional)</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-9 text-sm" placeholder="Any details about your project..." />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
            Confirm Appointment
          </Button>
        </div>
      )}
    </div>
  );
}