"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, ArrowRight, ArrowLeft, SkipForward, Mail, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ALERT_NOTIFICATIONS,
  ERROR_NOTIFICATIONS,
  isSwitchSetting,
  isSelectSetting,
  type NotificationTypeValue,
} from "@/lib/notifications"

interface NotificationPreferencesStepProps {
  settings: Record<NotificationTypeValue, boolean>
  onSettingChange: (type: NotificationTypeValue, enabled: boolean) => void
  onErrorSelectChange: (value: string) => void
  errorSelectValue: string
  onSave: () => void
  onSkip: () => void
  onBack?: () => void
  isLoading: boolean
  isEmailConfigured: boolean
}

export function NotificationPreferencesStep({
  settings,
  onSettingChange,
  onErrorSelectChange,
  errorSelectValue,
  onSave,
  onSkip,
  onBack,
  isLoading,
  isEmailConfigured,
}: NotificationPreferencesStepProps) {
  const parentSetting = ALERT_NOTIFICATIONS.find((s) => isSwitchSetting(s) && s.isParent)
  const childSettings = ALERT_NOTIFICATIONS.filter(
    (s) => isSwitchSetting(s) && s.parentType
  )
  const errorSetting = ERROR_NOTIFICATIONS[0]

  const isParentEnabled = parentSetting ? settings[parentSetting.type] : false
  const isDisabled = !isEmailConfigured

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            isDisabled ? "bg-muted" : "bg-primary/10"
          )}>
            {isDisabled ? (
              <Lock className="h-8 w-8 text-muted-foreground" />
            ) : (
              <Bell className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>
        <CardTitle className="text-2xl">Notification Preferences</CardTitle>
        <CardDescription>
          Choose which notifications you&apos;d like to receive. You can change these later in settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email not configured warning */}
        {isDisabled && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Mail className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">Email not configured</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-muted-foreground">
                Notifications require a configured email provider (SMTP or Resend). 
                Go back to the previous step to configure email, or you can set it up later via environment variables.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Alerts Section */}
        <div className={cn("space-y-4", isDisabled && "opacity-50 pointer-events-none")}>
          <h3 className="text-sm font-medium text-muted-foreground">Alerts</h3>

          {/* Parent Toggle */}
          {parentSetting && isSwitchSetting(parentSetting) && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <parentSetting.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor={parentSetting.type} className="font-medium">
                    {parentSetting.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {parentSetting.description}
                  </p>
                </div>
              </div>
              <Switch
                id={parentSetting.type}
                checked={settings[parentSetting.type]}
                onCheckedChange={(checked) => onSettingChange(parentSetting.type, checked)}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Child Toggles */}
          <div
            className={cn(
              "ml-4 space-y-2 transition-opacity",
              !isParentEnabled && "opacity-50 pointer-events-none"
            )}
          >
            {childSettings.map((setting) => {
              if (!isSwitchSetting(setting)) return null
              return (
                <div
                  key={setting.type}
                  className="flex items-center justify-between p-2 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <setting.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor={setting.type} className="text-sm">
                        {setting.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={setting.type}
                    checked={settings[setting.type]}
                    onCheckedChange={(checked) => onSettingChange(setting.type, checked)}
                    disabled={isLoading || !isParentEnabled}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Errors Section */}
        {errorSetting && isSelectSetting(errorSetting) && (
          <div className={cn("space-y-4", isDisabled && "opacity-50 pointer-events-none")}>
            <h3 className="text-sm font-medium text-muted-foreground">Errors</h3>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <errorSetting.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">{errorSetting.label}</Label>
                  <p className="text-xs text-muted-foreground">
                    {errorSetting.description}
                  </p>
                </div>
              </div>
              <Select
                value={errorSelectValue}
                onValueChange={onErrorSelectChange}
                disabled={isLoading || isDisabled}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {errorSetting.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isLoading}
          className="flex-1"
        >
          <SkipForward className="mr-2 h-4 w-4" />
          Skip
        </Button>
        <Button onClick={onSave} disabled={isLoading || isDisabled} className="flex-1">
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              Save & Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
