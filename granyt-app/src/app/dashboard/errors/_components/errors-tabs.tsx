"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorsList } from "./errors-list"

interface ErrorItem {
  id: string
  exceptionType: string
  message: string
  status: string
  occurrenceCount: number
  dagCount: number
  firstSeenAt: Date | string
  lastSeenAt: Date | string
}

interface ErrorsTabsProps {
  productionErrors: ErrorItem[]
  devErrors: ErrorItem[]
}

export function ErrorsTabs({ productionErrors, devErrors }: ErrorsTabsProps) {
  return (
    <Tabs defaultValue="production" className="space-y-4">
      <TabsList>
        <TabsTrigger value="production" className="gap-2">
          Production Errors
          {productionErrors.length > 0 && (
            <Badge variant="destructive" className="text-xs px-1 py-0">
              {productionErrors.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="development" className="gap-2">
          Dev Errors
          {devErrors.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {devErrors.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="production">
        <Card>
          <CardHeader>
            <CardTitle>Production Errors</CardTitle>
            <CardDescription>
              {productionErrors.length} error{productionErrors.length !== 1 ? "s" : ""} in production requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorsList 
              errors={productionErrors} 
              emptyMessage="All production DAGs are running smoothly"
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="development">
        <Card>
          <CardHeader>
            <CardTitle>Development Errors</CardTitle>
            <CardDescription>
              {devErrors.length} error{devErrors.length !== 1 ? "s" : ""} in non-production environments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorsList 
              errors={devErrors} 
              emptyMessage="All dev DAGs are running smoothly"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
