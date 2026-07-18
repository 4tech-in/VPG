import { Metadata } from "next"
import Image from "next/image"
import { FolderOpen, HardHat, Package, BarChart2, ShieldCheck } from "lucide-react"
import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "VPG",
  description: "VPG CRM Portal",
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex overflow-hidden">
      {/* Background Image */}
      <Image
        src="/loginimg.png"
        alt="Construction Background"
        fill
        className="absolute inset-0 object-cover z-0"
        priority
      />

      {/* Overlay to ensure text readability if needed */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* Main Content */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Side: Branding & Features */}
        <div className="flex-1 flex flex-col py-6 px-8 md:py-8 md:px-12 lg:py-10 lg:px-16 text-white justify-between">
          <div className="max-w-2xl my-auto">
            {/* Logo area */}
            <div className="mb-6 lg:mb-8">
              <h1 className="text-5xl font-black tracking-tighter flex items-center">
                <span className="text-white">VP</span><span className="text-[#c19b6c]">G</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-[1px] w-6 bg-[#c19b6c]"></div>
                <p className="text-[12px] font-bold tracking-widest uppercase">Construction</p>
                <div className="h-[1px] w-6 bg-[#c19b6c]"></div>
              </div>
              <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-400 mt-1 font-semibold ml-8">Building Excellence</p>
            </div>

            <div className="mb-6 lg:mb-8">
              <h2 className="text-4xl md:text-5xl font-medium leading-tight mb-1">
                Welcome to
              </h2>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight flex flex-wrap gap-3">
                <span className="font-black">VPG</span> 
                <span className="text-[#c19b6c]">CRM Portal</span>
              </h2>
              
              <div className="h-1 w-12 bg-[#c19b6c] mt-4 mb-6"></div>
              
              <h3 className="text-xl font-semibold mb-3">
                Building Excellence Through Technology
              </h3>
              
              <p className="text-base text-zinc-300 max-w-md leading-relaxed mb-6 lg:mb-8">
                Manage Projects, Clients, Contracts, Vendors, Inventory, Procurement, Employees, and Construction Operations from one centralized platform.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 xl:p-5 rounded-2xl">
                <FolderOpen className="h-5 w-5 text-[#c19b6c] mb-1.5" />
                <h4 className="font-bold text-lg mb-1">Project Management</h4>
                <p className="text-sm text-zinc-300 leading-tight">Track every project from planning to completion.</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 xl:p-5 rounded-2xl">
                <HardHat className="h-5 w-5 text-[#c19b6c] mb-1.5" />
                <h4 className="font-bold text-lg mb-1">Construction Monitoring</h4>
                <p className="text-sm text-zinc-300 leading-tight">Monitor site progress, milestones and execution.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 xl:p-5 rounded-2xl">
                <Package className="h-5 w-5 text-[#c19b6c] mb-1.5" />
                <h4 className="font-bold text-lg mb-1">Procurement</h4>
                <p className="text-sm text-zinc-300 leading-tight">Manage purchase orders, vendors and inventory.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 xl:p-5 rounded-2xl">
                <BarChart2 className="h-5 w-5 text-[#c19b6c] mb-1.5" />
                <h4 className="font-bold text-lg mb-1">Business Analytics</h4>
                <p className="text-sm text-zinc-300 leading-tight">Real-time dashboards and reports.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm text-zinc-300">
            <ShieldCheck className="h-5 w-5 text-[#c19b6c]" />
            <p>Secure. Reliable. Efficient. <span className="text-[#c19b6c] font-semibold">Built for Construction Excellence.</span></p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-[500px] xl:w-[600px] flex items-center justify-center p-4 md:p-6 my-auto">
          <div className="w-full max-w-md bg-white rounded-[2rem] p-6 md:p-8 xl:p-10 shadow-2xl">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
