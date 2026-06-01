"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    // Check token existence and expiration in proxy file
    if (hasActiveSession()) {
      setIsRedirecting(true)
      router.push("/dashboard")
    }
  }, [router])

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
      const response: any = await apiClient.post("/auth/login", {
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
      // Errors are already handled and toasted by the apiClient interceptor, 
      // but we catch here to stop loading and handle local control flow.
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)} 
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold font-heading">Welcome Back</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your credentials to access your dashboard
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email or Mobile</Label>
          <Input 
            id="email" 
            name="email"
            type="text" 
            placeholder="macro@gmail.com" 
            required 
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline text-primary"
            >
              Forgot your password?
            </a>
          </div>
          <div className="relative">
            <Input 
              id="password" 
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required 
              disabled={isLoading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Login"}
        </Button>
      </div>
    </form>
  )
}
