import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle2, X, User, Phone, Mail, Settings, Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DEFAULT_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

export default function AppointmentManager({ rooferId, rooferCompany }) {
  const queryClient = useQueryClient();
  const [newSlot, setNewSlot] = useState("");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", rooferId],
    queryFn: () => base44.entities.Appointment.filter({ roofer_id: rooferId }),
  });

  const { data: availList = [] } = useQuery({
    queryKey: ["availability", rooferId],
    queryFn: () => base44.entities.RooferAvailability.filter({ roofer_id: rooferId }),
  });

  const availability = availList[0];

  const updateApptMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments", rooferId] }),
  });

  const saveAvailMutation = useMutation({
    mutationFn: async (data) => {
      if (availability?.id) return base44.entities.RooferAvailability.update(availability.id, data);
      return base44.entities.RooferAvailability.create({ roofer_id: rooferId, roofer_company: rooferCompany, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", rooferId] });
      toast.success("Availability saved!");
    },
  });

  const toggleDay = (day) => {
    const days = availability?.available_days || ["monday","tuesday","wednesday","thursday","friday"];
    const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    saveAvailMutation.mutate({ ...availability, available_days: updated });
  };

  const addSlot = () => {
    if (!newSlot.trim()) return;
    const slots = availability?.time_slots || DEFAULT_SLOTS;
    saveAvailMutation.mutate({ ...availability, time_slots: [...slots, newSlot.trim()] });
    setNewSlot("");
  };

  const removeSlot = (slot) => {
    const slots = (availability?.time_slots || DEFAULT_SLOTS).filter(s => s !== slot);
    saveAvailMutation.mutate({ ...availability, time_slots: slots });
  };

  const upcoming = appointments.filter(a => a.status !== "cancelled" && a.status !== "completed" && a.date >= format(new Date(), "yyyy-MM-dd")).sort((a, b) => a.date.localeCompare(b.date));
  const past = appointments.filter(a => a.status === "completed" || a.date < format(new Date(), "yyyy-MM-dd")).sort((a, b) => b.date.localeCompare(a.date));

  const ApptCard = ({ appt }) => (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">{appt.homeowner_name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">{appt.date ? format(new Date(appt.date + "T12:00:00"), "MMM d, yyyy") : "—"}</span>
              <Clock className="w-3 h-3 text-slate-400 ml-1" />
              <span className="text-xs text-slate-500">{appt.time_slot}</span>
            </div>
          </div>
          <Badge className={`${statusColors[appt.status]} border text-xs`}>{appt.status}</Badge>
        </div>
        <div className="flex gap-3 text-xs text-slate-400 mb-3">
          {appt.homeowner_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{appt.homeowner_phone}</span>}
          {appt.homeowner_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{appt.homeowner_email}</span>}
        </div>
        {appt.address && <p className="text-xs text-slate-400 mb-3">📍 {appt.address}</p>}
        {appt.notes && <p className="text-xs text-slate-500 italic mb-3">"{appt.notes}"</p>}
        {appt.status === "pending" && (
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => { updateApptMutation.mutate({ id: appt.id, data: { status: "confirmed" } }); toast.success("Appointment confirmed!"); }}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Confirm
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200" onClick={() => { updateApptMutation.mutate({ id: appt.id, data: { status: "cancelled" } }); toast.success("Appointment cancelled."); }}>
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          </div>
        )}
        {appt.status === "confirmed" && (
          <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => { updateApptMutation.mutate({ id: appt.id, data: { status: "completed" } }); toast.success("Marked as complete!"); }}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Complete
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Tabs defaultValue="upcoming">
      <TabsList className="bg-white border mb-4">
        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
        <TabsTrigger value="availability">
          <Settings className="w-3.5 h-3.5 mr-1" /> Availability
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div> : (
          <div className="space-y-3">
            {upcoming.map(a => <ApptCard key={a.id} appt={a} />)}
            {!upcoming.length && <p className="text-sm text-slate-400 text-center py-10">No upcoming appointments.</p>}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past">
        <div className="space-y-3">
          {past.map(a => <ApptCard key={a.id} appt={a} />)}
          {!past.length && <p className="text-sm text-slate-400 text-center py-10">No past appointments.</p>}
        </div>
      </TabsContent>

      <TabsContent value="availability">
        <div className="space-y-5">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Available Days</p>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map(day => {
                  const active = (availability?.available_days || ["monday","tuesday","wednesday","thursday","friday"]).includes(day);
                  return (
                    <button key={day} onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${active ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}>
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Time Slots</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {(availability?.time_slots || DEFAULT_SLOTS).map(slot => (
                  <div key={slot} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <span className="text-xs text-slate-700">{slot}</span>
                    <button onClick={() => removeSlot(slot)} className="text-slate-300 hover:text-red-400 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newSlot} onChange={e => setNewSlot(e.target.value)} placeholder="e.g. 5:00 PM" className="h-8 text-sm" onKeyDown={e => e.key === "Enter" && addSlot()} />
                <Button size="sm" onClick={addSlot} className="h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Settings</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Timezone</Label>
                  <Select value={availability?.timezone || "America/New_York"} onValueChange={v => saveAvailMutation.mutate({ ...availability, timezone: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Max Appts/Day</Label>
                  <Input
                    type="number"
                    value={availability?.max_appointments_per_day || 3}
                    onChange={e => saveAvailMutation.mutate({ ...availability, max_appointments_per_day: parseInt(e.target.value) || 3 })}
                    className="h-9 text-sm"
                    min={1} max={10}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}