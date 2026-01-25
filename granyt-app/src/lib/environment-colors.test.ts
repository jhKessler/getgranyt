import { describe, it, expect } from "vitest"
import {
  getEnvironmentBadgeStyle,
  getEnvironmentDotColor,
  isProductionEnvironment,
} from "./environment-colors"

describe("environment-colors", () => {
  describe("getEnvironmentBadgeStyle", () => {
    describe("known environments", () => {
      it("returns orange for production", () => {
        const style = getEnvironmentBadgeStyle("production")
        expect(style).toContain("orange-500")
      })

      it("returns blue for staging", () => {
        const style = getEnvironmentBadgeStyle("staging")
        expect(style).toContain("blue-500")
      })

      it("returns green for development", () => {
        const style = getEnvironmentBadgeStyle("development")
        expect(style).toContain("green-500")
      })

      it("returns purple for qa", () => {
        const style = getEnvironmentBadgeStyle("qa")
        expect(style).toContain("purple-500")
      })

      it("returns yellow for test", () => {
        const style = getEnvironmentBadgeStyle("test")
        expect(style).toContain("yellow-500")
      })

      it("returns cyan for sandbox", () => {
        const style = getEnvironmentBadgeStyle("sandbox")
        expect(style).toContain("cyan-500")
      })

      it("returns pink for preview", () => {
        const style = getEnvironmentBadgeStyle("preview")
        expect(style).toContain("pink-500")
      })
    })

    describe("aliases", () => {
      it("treats 'dev' as development", () => {
        expect(getEnvironmentBadgeStyle("dev")).toBe(
          getEnvironmentBadgeStyle("development")
        )
      })

      it("treats 'prod' as production", () => {
        expect(getEnvironmentBadgeStyle("prod")).toBe(
          getEnvironmentBadgeStyle("production")
        )
      })
    })

    describe("case insensitivity", () => {
      it("is case-insensitive for known environments", () => {
        expect(getEnvironmentBadgeStyle("PRODUCTION")).toBe(
          getEnvironmentBadgeStyle("production")
        )
        expect(getEnvironmentBadgeStyle("Production")).toBe(
          getEnvironmentBadgeStyle("production")
        )
        expect(getEnvironmentBadgeStyle("STAGING")).toBe(
          getEnvironmentBadgeStyle("staging")
        )
      })

      it("is case-insensitive for aliases", () => {
        expect(getEnvironmentBadgeStyle("DEV")).toBe(
          getEnvironmentBadgeStyle("development")
        )
        expect(getEnvironmentBadgeStyle("PROD")).toBe(
          getEnvironmentBadgeStyle("production")
        )
      })
    })

    describe("custom environments (hash-based)", () => {
      it("returns consistent color for custom environment", () => {
        const color1 = getEnvironmentBadgeStyle("my-custom-env")
        const color2 = getEnvironmentBadgeStyle("my-custom-env")
        expect(color1).toBe(color2)
      })

      it("returns different colors for different custom environments", () => {
        const color1 = getEnvironmentBadgeStyle("env-alpha")
        const color2 = getEnvironmentBadgeStyle("env-beta")
        const color3 = getEnvironmentBadgeStyle("env-gamma")
        // At least some should be different (statistically very likely)
        const unique = new Set([color1, color2, color3])
        expect(unique.size).toBeGreaterThan(1)
      })

      it("returns valid badge classes for custom environment", () => {
        const style = getEnvironmentBadgeStyle("random-env-123")
        expect(style).toMatch(/bg-\w+-500\/10/)
        expect(style).toMatch(/text-\w+-500/)
        expect(style).toMatch(/border-\w+-500\/20/)
      })
    })

    describe("edge cases", () => {
      it("returns muted style for null", () => {
        const style = getEnvironmentBadgeStyle(null)
        expect(style).toContain("bg-muted")
      })

      it("returns muted style for undefined", () => {
        const style = getEnvironmentBadgeStyle(undefined)
        expect(style).toContain("bg-muted")
      })

      it("returns muted style for empty string", () => {
        const style = getEnvironmentBadgeStyle("")
        expect(style).toContain("bg-muted")
      })

      it("trims whitespace", () => {
        expect(getEnvironmentBadgeStyle("  production  ")).toBe(
          getEnvironmentBadgeStyle("production")
        )
      })
    })

    describe("variants", () => {
      it("returns muted style for muted variant regardless of environment", () => {
        const prodMuted = getEnvironmentBadgeStyle("production", "muted")
        const stagingMuted = getEnvironmentBadgeStyle("staging", "muted")
        const customMuted = getEnvironmentBadgeStyle("custom-env", "muted")

        expect(prodMuted).toContain("bg-muted")
        expect(stagingMuted).toContain("bg-muted")
        expect(customMuted).toContain("bg-muted")
        expect(prodMuted).toBe(stagingMuted)
        expect(stagingMuted).toBe(customMuted)
      })

      it("returns red for production in error variant", () => {
        const style = getEnvironmentBadgeStyle("production", "error")
        expect(style).toContain("red-500")
      })

      it("returns orange for non-production in error variant", () => {
        const stagingError = getEnvironmentBadgeStyle("staging", "error")
        const customError = getEnvironmentBadgeStyle("custom-env", "error")

        expect(stagingError).toContain("orange-500")
        expect(customError).toContain("orange-500")
      })
    })
  })

  describe("getEnvironmentDotColor", () => {
    it("returns orange dot for production", () => {
      expect(getEnvironmentDotColor("production")).toBe("bg-orange-500")
    })

    it("returns blue dot for staging", () => {
      expect(getEnvironmentDotColor("staging")).toBe("bg-blue-500")
    })

    it("returns green dot for development", () => {
      expect(getEnvironmentDotColor("development")).toBe("bg-green-500")
    })

    it("returns muted dot for null/undefined", () => {
      expect(getEnvironmentDotColor(null)).toBe("bg-muted-foreground")
      expect(getEnvironmentDotColor(undefined)).toBe("bg-muted-foreground")
    })

    it("returns consistent dot color for custom environments", () => {
      const dot1 = getEnvironmentDotColor("my-custom-env")
      const dot2 = getEnvironmentDotColor("my-custom-env")
      expect(dot1).toBe(dot2)
    })
  })

  describe("isProductionEnvironment", () => {
    it("returns true for 'production'", () => {
      expect(isProductionEnvironment("production")).toBe(true)
    })

    it("returns true for 'prod' (alias)", () => {
      expect(isProductionEnvironment("prod")).toBe(true)
    })

    it("is case-insensitive", () => {
      expect(isProductionEnvironment("PRODUCTION")).toBe(true)
      expect(isProductionEnvironment("Production")).toBe(true)
      expect(isProductionEnvironment("PROD")).toBe(true)
    })

    it("returns false for other environments", () => {
      expect(isProductionEnvironment("staging")).toBe(false)
      expect(isProductionEnvironment("development")).toBe(false)
      expect(isProductionEnvironment("custom-env")).toBe(false)
    })

    it("returns false for null/undefined/empty", () => {
      expect(isProductionEnvironment(null)).toBe(false)
      expect(isProductionEnvironment(undefined)).toBe(false)
      expect(isProductionEnvironment("")).toBe(false)
    })
  })
})
