"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2, ArrowRight } from "lucide-react"

interface OrganizationStepProps {
  organizationName: string
  onOrganizationNameChange: (name: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

export function OrganizationStep({
  organizationName,
  onOrganizationNameChange,
  onSubmit,
  isLoading,
}: OrganizationStepProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Create your organization</CardTitle>
        <CardDescription>
          Set up your organization to start monitoring your DAGs
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              type="text"
              placeholder="Acme Inc."
              value={organizationName}
              onChange={(e) => onOrganizationNameChange(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : (
              <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
