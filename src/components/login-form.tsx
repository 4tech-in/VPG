"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/store/use-auth-store"
import { hasActiveSession } from "@/store/proxy"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (hasActiveSession()) {
      setIsRedirecting(true)
      router.push("/dashboard")
    }
  }, [router])

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0B1A30] border-t-transparent" />
        <p className="text-sm font-semibold text-zinc-500">Redirecting to dashboard...</p>
      </div>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const emailOrMobile = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response: any = await apiClient.post("auth/login", {
        emailOrMobile,
        password,
      })

      if (response && response.token) {
        useAuthStore.getState().setAuth(response.token, response.data)

        toast.success("Login successful! Redirecting...")
        router.push("/dashboard")
      } else {
        toast.error("Login failed. Unexpected response from server.")
      }
    } catch (error: any) {
      // Errors handled by interceptor
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {/* Form Logo */}
      <div className="flex flex-col items-center justify-center mb-6">
        <h1 className="text-4xl font-black tracking-tighter flex items-center">
          <span className="text-[#0B1A30]">VP</span><span className="text-[#c19b6c]">G</span>
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-[1px] w-4 bg-[#c19b6c]"></div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#0B1A30]">Construction</p>
          <div className="h-[1px] w-4 bg-[#c19b6c]"></div>
        </div>
        <p className="text-[8px] tracking-[0.2em] uppercase text-zinc-400 mt-1 font-semibold ml-6">Building Excellence</p>
      </div>

      <div className="flex flex-col items-center gap-2 text-center mb-6">
        <h2 className="text-2xl font-bold text-[#0B1A30]">Welcome Back</h2>
        <p className="text-sm text-zinc-500">
          Sign in to access your Construction CRM
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-sm font-bold text-[#0B1A30]">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              id="email"
              name="email"
              type="text"
              placeholder="Enter your email address"
              required
              disabled={isLoading}
              className="pl-12 h-12 text-sm rounded-xl border-zinc-200 focus-visible:ring-[#0B1A30]"
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-sm font-bold text-[#0B1A30]">Password</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className="pl-12 pr-12 h-12 text-sm rounded-xl border-zinc-200 focus-visible:ring-[#0B1A30]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" className="data-[state=checked]:bg-[#c19b6c] data-[state=checked]:border-[#c19b6c] border-zinc-300 rounded" />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-600"
            >
              Remember Me
            </label>
          </div>
          <a
            href="#"
            className="text-sm font-semibold text-[#c19b6c] hover:underline"
          >
            Forgot Password?
          </a>
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl bg-[#0B1A30] hover:bg-[#0B1A30]/90 text-white text-sm font-bold flex justify-between px-6" disabled={isLoading}>
          <span>{isLoading ? "SIGNING IN..." : "LOGIN TO CRM"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
        
        <div className="relative my-0.5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200" />
          </div>
          
        </div>
        
      

        <div className="text-center mt-4">
          <p className="text-sm text-zinc-500">
            Don&apos;t have an account? <a href="#" className="font-semibold text-[#c19b6c] hover:underline">Contact Admin</a>
          </p>
        </div>
      </div>
    </form>
  )
}
