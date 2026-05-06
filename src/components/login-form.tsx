"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (email === "test@email.com" && password === "123456") {
      toast.success("Login successful! Redirecting...")
      router.push("/dashboard")
    } else {
      toast.error("Invalid email or password. Please try again.")
    }

    setIsLoading(false)
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
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email"
            type="email" 
            placeholder="test@email.com" 
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
          <Input 
            id="password" 
            name="password"
            type="password" 
            placeholder="••••••••"
            required 
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Login"}
        </Button>
      </div>
    </form>
  )
}
