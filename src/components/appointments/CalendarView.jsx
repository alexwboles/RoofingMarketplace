import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay } from "date-fns";

const statusDot = {
  pending: "bg-amber-400",
  confirmed: "bg-blue-400",
  completed: "bg-emerald-400",
  cancelled: "bg-red-300",
};

export default function CalendarView({ appointments }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const apptsByDay = {};
  appointments.forEach(a => {
    if (!a.date) return;
    const key = a.date;
    if (!apptsByDay[key]) apptsByDay[key] = [];
    apptsByDay[key].push(a);
  });

  const selectedAppts = selected ? (apptsByDay[format(selected, "yyyy-MM-dd")] || []) : [];

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center mb-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-[10px] font-semibold text-slate-400 uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const key = format(day, "yyyy-MM-dd");
          const dayAppts = apptsByDay[key] || [];
          const isSelected = selected && isSameDay(day, selected);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={key}
              onClick={() => setSelected(isSelected ? null : day)}
              className={`relative rounded-xl p-1.5 min-h-[52px] text-left transition-all border ${
                isSelected ? "bg-amber-50 border-amber-400 ring-2 ring-amber-300" :
                isToday ? "bg-blue-50 border-blue-200" :
                "bg-white border-slate-100 hover:border-slate-300"
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-blue-600" : isSelected ? "text-amber-700" : "text-slate-700"}`}>
                {format(day, "d")}
              </span>
              {dayAppts.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dayAppts.slice(0, 3).map((a, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${statusDot[a.status] || "bg-slate-300"}`} />
                  ))}
                  {dayAppts.length > 3 && <span className="text-[9px] text-slate-400">+{dayAppts.length - 3}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day appointments */}
      {selected && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {format(selected, "EEEE, MMMM d")} — {selectedAppts.length} appointment{selectedAppts.length !== 1 ? "s" : ""}
          </p>
          {selectedAppts.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No appointments on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedAppts.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-white rounded-lg border border-slate-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.homeowner_name}</p>
                    <p className="text-xs text-slate-400">{a.time_slot} · {a.address}</p>
                  </div>
                  <Badge className={`border text-xs ${
                    a.status === "confirmed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    a.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    a.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    "bg-red-50 text-red-700 border-red-200"
                  }`}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(statusDot).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            <span className="text-xs text-slate-500 capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}