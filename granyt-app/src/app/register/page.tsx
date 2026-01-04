"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { useDocumentTitle } from "@/lib/use-document-title"
import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc"

export default function RegisterPage() {
  useDocumentTitle("Create Account")
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { data: isSignUpEnabled, isLoading: isCheckingSignUp } = trpc.auth.isSignUpEnabled.useQuery()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await authClient.signUp.email({ email, password, name })

      if (result.error) {
        toast.error(result.error.message || "Failed to create account")
        return
      }

      toast.success("Account created successfully!")
      router.push("/onboarding")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      description={isSignUpEnabled === false ? "Registration is currently disabled" : "Get started with Granyt today"}
      footer={
        <>
          <Button 
            type="submit" 
            form="register-form" 
            className="w-full" 
            disabled={isLoading || isSignUpEnabled === false || isCheckingSignUp}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </>
      }
    >
      {isSignUpEnabled === false ? (
        <div className="p-4 bg-muted rounded-lg text-sm text-center">
          Registration is limited to a single user and an account already exists. 
          Please contact the administrator if you need access.
        </div>
      ) : (
        <form id="register-form" onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading || isCheckingSignUp}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || isCheckingSignUp}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || isCheckingSignUp}
            />
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
