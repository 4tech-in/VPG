"use client";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  BookmarkCheck, 
  Clock, 
  Search, 
  Bell, 
  Globe, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <ContentLayout title="Dashboard">
      <div className="flex flex-col gap-6 p-4 md:p-8 pt-2">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
            <p className="text-muted-foreground">Good morning James 👋</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Type here to search anything" 
                className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium text-muted-foreground">
                ⌘F
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-border shadow-sm">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg"><Globe className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </Button>
            </div>
            
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Add Member
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Books", value: "12,856", icon: BookOpen, change: "+120", trend: "up", sub: "In collection", color: "text-blue-600", bg: "bg-blue-50" },
            { title: "Active Members", value: "2,170+", icon: Users, change: "+3.7%", trend: "up", sub: "This month", color: "text-emerald-600", bg: "bg-emerald-50" },
            { title: "Borrowed Books", value: "4,793+", icon: BookmarkCheck, change: "+25%", trend: "up", sub: "Books borrowed", color: "text-orange-600", bg: "bg-orange-50" },
            { title: "Overdue Returns", value: "237+", icon: Clock, change: "-5.8%", trend: "down", sub: "Item overdue", color: "text-rose-600", bg: "bg-rose-50" },
          ].map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={stat.bg + " p-3 rounded-xl " + stat.color}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                      stat.trend === "up" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {stat.trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {stat.change}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stat.value}</span>
                      <span className="text-[10px] text-muted-foreground">{stat.sub}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Breakdown */}
          <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">Total → <span className="font-bold text-foreground text-lg">$20,671</span></p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl h-8">This week</Button>
            </CardHeader>
            <CardContent className="h-[300px] flex items-end justify-between gap-2 pt-0">
              {[
                { label: "Membership Fees", value: 60, color: "bg-primary/20", height: "h-[60%]" },
                { label: "Overdue Fines", value: 45, color: "bg-primary/40", height: "h-[45%]" },
                { label: "Events", value: 85, color: "bg-primary", height: "h-[85%]", active: true },
                { label: "Others", value: 30, color: "bg-primary/10", height: "h-[30%]" },
              ].map((bar) => (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="relative w-full h-full flex items-end justify-center px-4">
                    <motion.div 
                      className={cn(
                        "w-full rounded-t-xl transition-all duration-300",
                        bar.color,
                        bar.height,
                        bar.active ? "shadow-lg shadow-primary/20" : ""
                      )}
                      initial={{ height: 0 }}
                      animate={{ height: bar.height === "h-[60%]" ? "60%" : bar.height === "h-[45%]" ? "45%" : bar.height === "h-[85%]" ? "85%" : "30%" }}
                    />
                    {bar.active && (
                      <div className="absolute top-10 bg-black text-white p-2 rounded-lg text-[10px] shadow-xl z-10">
                        <div className="font-bold mb-1">Revenue</div>
                        <div className="text-sm">$4,910</div>
                        <div className="flex items-center gap-1 text-emerald-400 mt-1">
                          <ArrowUpRight size={10} /> +3.7%
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium text-center">{bar.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Most Borrowed Categories */}
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Most Borrowed</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <div className="relative h-[200px] flex items-center justify-center mb-6">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-muted/20" />
                  <circle 
                    cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" 
                    strokeDasharray={440} 
                    strokeDashoffset={440 * 0.65}
                    strokeLinecap="round"
                    className="text-primary" 
                  />
                  <circle 
                    cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" 
                    strokeDasharray={440} 
                    strokeDashoffset={440 * 0.9}
                    strokeLinecap="round"
                    className="text-emerald-400" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-bold">Fiction</span>
                  <span className="text-[10px] text-muted-foreground">35% - 1,677 Books</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Fiction", value: "35%", color: "bg-primary" },
                  { name: "Children's", value: "15%", color: "bg-emerald-400" },
                  { name: "History", value: "17%", color: "bg-blue-400" },
                  { name: "Novels", value: "23%", color: "bg-orange-400" },
                ].map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <span className="text-sm font-bold">{cat.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Overdue Summary Table */}
           <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Overdue Items Summary</CardTitle>
              <Button variant="outline" size="sm" className="rounded-xl h-8">This week</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-y border-border">
                      <th className="text-left py-3 px-6 font-medium text-muted-foreground">Borrower</th>
                      <th className="text-left py-3 px-6 font-medium text-muted-foreground">Book Info</th>
                      <th className="text-left py-3 px-6 font-medium text-muted-foreground">Days O/D</th>
                      <th className="text-left py-3 px-6 font-medium text-muted-foreground">Fine</th>
                      <th className="text-right py-3 px-6 font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { name: "John Smith", id: "USR-2007", book: "Don Quixote", author: "Miguel de Cervantes", days: "05 Days", fine: "$4.5", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Emma", id: "USR-2025", book: "Pride and Prejudice", author: "Jane Austen", days: "04 Days", fine: "$3.5", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Sarah", id: "USR-2058", book: "The Alchemist", author: "Paulo Coelho", days: "07 Days", fine: "$5.5", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Image src={row.img} className="w-8 h-8 rounded-full" alt="" width={32} height={32} />
                            <div className="flex flex-col">
                              <span className="font-bold text-xs">{row.name}</span>
                              <span className="text-[10px] text-muted-foreground">ID: {row.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{row.book}</span>
                            <span className="text-[10px] text-muted-foreground">{row.author}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs">{row.days}</td>
                        <td className="py-4 px-6 font-bold text-xs">{row.fine}</td>
                        <td className="py-4 px-6 text-right">
                          <Button variant="outline" size="sm" className="h-8 rounded-lg text-primary border-primary/20 hover:bg-primary/5">Notify</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Authors */}
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Top Authors</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary text-xs">View all</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 pt-2">
                {[
                  { name: "Miguel de Cervantes", books: 13, borrowers: 617, rank: 1, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100" },
                  { name: "Jane Austen", books: 11, borrowers: 587, rank: 2, img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100" },
                  { name: "Paulo Coelho", books: 10, borrowers: 497, rank: 3, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100" },
                ].map((author, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="relative">
                      <Image src={author.img} className="w-10 h-10 rounded-full" alt="" width={40} height={40} />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
                        {author.rank}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-bold text-sm">{author.name}</span>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen size={10} /> {author.books} Books</span>
                        <span className="flex items-center gap-1"><Users size={10} /> {author.borrowers} Borrowers</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
