"use client"

import { useState } from "react"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import "@/app/calendar.css"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Calendar as CalendarIcon,
  ChevronDown,
  ArrowLeft,
  ArrowRight
} from "lucide-react"
import { format, startOfWeek, addDays, isSameDay, startOfYear, addMonths, setMonth } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type ViewType = "day" | "week" | "month" | "year"

const MOCK_EVENTS = [
  {
    id: "1",
    title: "Structural Audit - VPG Phase 1",
    time: "09:00 AM",
    location: "Sector 402, VPG",
    priority: "high",
    date: new Date(2026, 4, 16)
  },
  {
    id: "2",
    title: "Project Sync: Twin Towers",
    time: "02:00 PM",
    location: "Main HQ",
    priority: "medium",
    date: new Date(2026, 4, 16)
  },
  {
    id: "3",
    title: "Client Site Visit",
    time: "10:00 AM",
    location: "Downtown Plaza",
    priority: "urgent",
    date: new Date(2026, 4, 17)
  }
]

export function CalendarView() {
  const [view, setView] = useState<ViewType>("month")
  const [date, setDate] = useState(new Date(2026, 4, 16))

  const handlePrev = () => {
    if (view === "month") setDate(addMonths(date, -1))
    if (view === "week") setDate(addDays(date, -7))
    if (view === "day") setDate(addDays(date, -1))
    if (view === "year") setDate(startOfYear(addDays(date, -365)))
  }

  const handleNext = () => {
    if (view === "month") setDate(addMonths(date, 1))
    if (view === "week") setDate(addDays(date, 7))
    if (view === "day") setDate(addDays(date, 1))
    if (view === "year") setDate(startOfYear(addDays(date, 365)))
  }

  const renderDayView = () => {
    const dayEvents = MOCK_EVENTS.filter(e => isSameDay(e.date, date))
    return (
      <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-sm min-h-[600px]">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-50">
          <div className="flex flex-col">
            <span className="text-xs font-black text-primary uppercase tracking-widest">{format(date, "EEEE")}</span>
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{format(date, "MMMM dd, yyyy")}</h3>
          </div>
          <Button className="h-12 rounded-2xl gap-2 font-bold shadow-xl shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Mission
          </Button>
        </div>
        <div className="space-y-4">
          {dayEvents.length > 0 ? dayEvents.map(event => (
            <div key={event.id} className="flex gap-6 p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl transition-all group">
              <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary font-black text-xs uppercase">
                {event.time}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                    event.priority === "urgent" ? "bg-rose-500" : event.priority === "high" ? "bg-amber-500" : "bg-primary"
                  )}>{event.priority}</Badge>
                  <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {event.location}
                  </span>
                </div>
                <h4 className="text-lg font-black text-zinc-900">{event.title}</h4>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center opacity-40 grayscale flex flex-col items-center">
              <CalendarIcon className="h-16 w-16 mb-4" />
              <p className="font-bold">No Missions Scheduled</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const start = startOfWeek(date)
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    return (
      <div className="grid grid-cols-7 border-t border-l border-zinc-100 bg-white rounded-[2.5rem] overflow-hidden shadow-sm min-h-[600px]">
        {weekDays.map(day => {
          const dayEvents = MOCK_EVENTS.filter(e => isSameDay(e.date, day))
          return (
            <div key={day.toString()} className={cn(
              "flex flex-col gap-4 p-6 border-r border-b border-zinc-100 transition-all",
              isSameDay(day, new Date()) ? "bg-primary/5" : "hover:bg-zinc-50/50"
            )}>
              <div className="text-left space-y-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{format(day, "EEEE")}</span>
                <div className={cn(
                  "text-2xl font-black",
                  isSameDay(day, date) ? "text-primary" : "text-zinc-900"
                )}>
                  {format(day, "d")}
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {dayEvents.map(e => (
                  <div key={e.id} className={cn(
                    "text-[10px] font-bold p-3 rounded-xl border shadow-sm truncate",
                    e.priority === "urgent" ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-white border-zinc-100 text-zinc-600"
                  )}>
                    {e.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderYearView = () => {
    const start = startOfYear(date)
    const months = Array.from({ length: 12 }, (_, i) => addMonths(start, i))
    return (
      <div className="grid grid-cols-3 border-t border-l border-zinc-100 bg-white rounded-[2.5rem] overflow-hidden shadow-sm">
        {months.map((month, idx) => {
          const isActive = format(date, "MMMM") === format(month, "MMMM")
          return (
            <div
              key={month.toString()}
              onClick={() => {
                setDate(setMonth(date, idx))
                setView("month")
              }}
              className={cn(
                "p-12 border-r border-b border-zinc-100 transition-all cursor-pointer flex flex-col justify-between min-h-[220px]",
                isActive ? "bg-primary text-white" : "bg-white hover:bg-zinc-50"
              )}
            >
              <h4 className={cn(
                "text-xl font-black tracking-tight",
                isActive ? "text-white" : "text-zinc-900"
              )}>
                {format(month, "MMMM")}
              </h4>

              <div className="flex justify-end">
                <div className={cn(
                  "h-1.5 w-8 rounded-full",
                  isActive ? "bg-white/40" : "bg-zinc-100"
                )} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-full">

      {/* Enhanced Calendar Control Bar */}
      <div className="flex flex-col gap-6">
        {/* Top Navigation Row */}
        <div className="bg-zinc-50/50 rounded-3xl p-3 border border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4 pl-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm" onClick={handlePrev}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm" onClick={handleNext}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-6 w-px bg-zinc-200 mx-2" />
            <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              {view === "year" ? format(date, "yyyy") : format(date, "MMMM yyyy")}
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </h2>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-zinc-100/50 rounded-2xl">
            {(["day", "week", "month", "year"] as ViewType[]).map((v) => (
              <Button
                key={v}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  view === v ? "bg-white shadow-md text-primary" : "text-zinc-400"
                )}
                onClick={() => setView(v)}
              >
                {v}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic View Engine */}
      <div className="w-full">
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && (
          <div className="bg-white rounded-[2.5rem] p-4 border border-zinc-100 shadow-sm overflow-hidden">
            <Calendar
              value={date}
              onChange={(v) => setDate(v as Date)}
              tileContent={({ date, view }) => {
                if (view === "month") {
                  const dateEvents = MOCK_EVENTS.filter(e => isSameDay(e.date, date))
                  if (dateEvents.length === 0) return null
                  return (
                    <div className="mt-2 flex flex-col gap-1 w-full px-1">
                      {dateEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate border text-left",
                            event.priority === "urgent" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-primary/5 text-primary border-primary/10"
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
              nextLabel={null}
              prevLabel={null}
              next2Label={null}
              prev2Label={null}
              className="border-none w-full max-w-none"
            />
          </div>
        )}
        {view === "year" && renderYearView()}
      </div>

    </div>
  )
}
