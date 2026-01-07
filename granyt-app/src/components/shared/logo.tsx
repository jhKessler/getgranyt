import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
  textClassName?: string
}

const sizeMap = {
  sm: { logo: 36, text: "text-lg" },
  md: { logo: 44, text: "text-xl" },
  lg: { logo: 56, text: "text-3xl" },
}

export function Logo({ 
  size = "md", 
  className,
  showText = true,
  textClassName,
}: LogoProps) {
  const { logo, text } = sizeMap[size]
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="Granyt"
        width={logo}
        height={logo}
        className="object-contain"
        priority
      />
      {showText && (
        <span className={cn("font-bold", text, textClassName)}>Granyt</span>
      )}
    </div>
  )
}
