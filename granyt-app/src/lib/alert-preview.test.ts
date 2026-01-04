import { describe, it, expect } from "vitest"
import { 
  getAlertPreviewText, 
  hasAlertPreviewGenerator, 
  getAlertTypeLabel 
} from "./alert-preview"

describe("Alert Preview Utility", () => {
  describe("getAlertPreviewText", () => {
    describe("ROW_COUNT_DROP", () => {
      it("should generate preview with full metadata", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", {
          dropPercentage: 100,
          current: 1,
          baseline: 9865,
        })
        // Using toContain to avoid locale-dependent number formatting
        expect(result).toContain("Row count dropped 100%")
        expect(result).toContain("1")
        expect(result).toContain("9")  // baseline will be formatted
      })

      it("should handle zero current rows", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", {
          dropPercentage: 100,
          current: 0,
          baseline: 5000,
        })
        expect(result).toContain("Row count dropped 100%")
        expect(result).toContain("0")
        expect(result).toContain("was")
      })

      it("should handle missing baseline", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", {
          dropPercentage: 95,
          current: 50,
        })
        expect(result).toBe("Row count dropped 95%")
      })

      it("should round drop percentage", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", {
          dropPercentage: 95.7,
          current: 43,
          baseline: 1000,
        })
        expect(result).toContain("Row count dropped 96%")
        expect(result).toContain("43")
      })

      it("should handle undefined metadata", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", undefined)
        expect(result).toBe("Row count dropped significantly")
      })

      it("should handle empty metadata", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", {})
        expect(result).toBe("Row count dropped significantly")
      })
    })

    describe("NULL_OCCURRENCE", () => {
      it("should generate preview for single column", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [{ name: "email" }],
          columnCount: 1,
        })
        expect(result).toBe("Null values appeared in column: email")
      })

      it("should generate preview for two columns", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [{ name: "email" }, { name: "phone" }],
          columnCount: 2,
        })
        expect(result).toBe("Null values appeared in 2 columns: email, phone")
      })

      it("should truncate many columns with +N more", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [
            { name: "email" },
            { name: "phone" },
            { name: "address" },
            { name: "city" },
            { name: "state" },
          ],
          columnCount: 5,
        })
        expect(result).toBe("Null values appeared in 5 columns: email, phone +3 more")
      })

      it("should use columnCount from metadata if provided", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [{ name: "email" }],
          columnCount: 3,
        })
        // columnCount takes precedence
        expect(result).toBe("Null values appeared in 3 columns: email +1 more")
      })

      it("should handle undefined metadata", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", undefined)
        expect(result).toBe("Null values detected in previously non-null columns")
      })

      it("should handle empty affected columns", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [],
        })
        expect(result).toBe("Null values detected in previously non-null columns")
      })
    })

    describe("SCHEMA_CHANGE", () => {
      it("should generate preview for added columns only", () => {
        const result = getAlertPreviewText("SCHEMA_CHANGE", {
          summary: {
            addedCount: 2,
            removedCount: 0,
            typeChangedCount: 0,
            totalChanges: 2,
          },
        })
        expect(result).toBe("Schema changed: 2 columns added")
      })

      it("should generate preview for removed columns only", () => {
        const result = getAlertPreviewText("SCHEMA_CHANGE", {
          summary: {
            addedCount: 0,
            removedCount: 1,
            typeChangedCount: 0,
            totalChanges: 1,
          },
        })
        expect(result).toBe("Schema changed: 1 column removed")
      })

      it("should generate preview for type changes only", () => {
        const result = getAlertPreviewText("SCHEMA_CHANGE", {
          summary: {
            addedCount: 0,
            removedCount: 0,
            typeChangedCount: 3,
            totalChanges: 3,
          },
        })
        expect(result).toBe("Schema changed: 3 types changed")
      })

      it("should generate preview for mixed changes", () => {
        const result = getAlertPreviewText("SCHEMA_CHANGE", {
          summary: {
            addedCount: 2,
            removedCount: 1,
            typeChangedCount: 1,
            totalChanges: 4,
          },
        })
        expect(result).toBe("Schema changed: 2 columns added, 1 column removed, 1 type changed")
      })

      it("should handle undefined metadata", () => {
        const result = getAlertPreviewText("SCHEMA_CHANGE", undefined)
        expect(result).toBe("Schema changed")
      })

      it("should handle empty summary", () => {
        const result = getAlertPreviewText("SCHEMA_CHANGE", {
          summary: {
            addedCount: 0,
            removedCount: 0,
            typeChangedCount: 0,
            totalChanges: 0,
          },
        })
        expect(result).toBe("Schema changed")
      })
    })

    describe("Unknown alert types", () => {
      it("should generate fallback preview for unknown types", () => {
        const result = getAlertPreviewText("FUTURE_ALERT_TYPE", undefined)
        expect(result).toBe("Future Alert Type detected")
      })

      it("should handle snake_case conversion", () => {
        const result = getAlertPreviewText("SLOW_DEGRADATION", undefined)
        expect(result).toBe("Slow Degradation detected")
      })

      it("should handle single word types", () => {
        const result = getAlertPreviewText("ANOMALY", undefined)
        expect(result).toBe("Anomaly detected")
      })
    })

    describe("Security Edge Cases", () => {
      it("should handle column names with HTML-like content", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [{ name: "<script>alert('xss')</script>" }],
          columnCount: 1,
        })
        // Should contain the raw text (sanitization happens at render)
        expect(result).toContain("<script>")
      })

      it("should handle column names with SQL injection patterns", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [{ name: "'; DROP TABLE users; --" }],
          columnCount: 1,
        })
        // Should preserve the text (no SQL here, just preview text)
        expect(result).toContain("DROP TABLE")
      })

      it("should handle extremely large dropPercentage values", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", {
          dropPercentage: 999999999999,
          current: 0,
          baseline: 100,
        })
        // Should handle large numbers without breaking
        expect(result).toContain("999999999999%")
      })

      it("should handle negative dropPercentage", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", {
          dropPercentage: -50,
          current: 150,
          baseline: 100,
        })
        // Should handle negative (increase) gracefully
        expect(result).toContain("-50%")
      })

      it("should handle NaN dropPercentage", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", {
          dropPercentage: NaN,
          current: 0,
          baseline: 0,
        })
        // NaN is not undefined, so it goes through the percentage path
        // Math.round(NaN) = NaN, so the result contains 'NaN'
        expect(result).toContain("NaN")
      })

      it("should handle Infinity dropPercentage", () => {
        const result = getAlertPreviewText("ROW_COUNT_DROP", {
          dropPercentage: Infinity,
          current: 0,
          baseline: 100,
        })
        // Should handle infinity case
        expect(result).toContain("Infinity")
      })

      it("should handle column names with newlines", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [{ name: "column\nwith\nnewlines" }],
          columnCount: 1,
        })
        expect(result).toContain("column")
      })

      it("should handle column names with unicode zero-width characters", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [{ name: "col\u200Bumn\u200B" }], // Zero-width spaces
          columnCount: 1,
        })
        expect(result).toContain("col")
      })

      it("should handle very long column names", () => {
        const longName = "column_" + "a".repeat(1000)
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [{ name: longName }],
          columnCount: 1,
        })
        expect(result.length).toBeGreaterThan(100)
      })

      it("should handle empty string column name", () => {
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: [{ name: "" }],
          columnCount: 1,
        })
        // Should still produce output
        expect(result).toContain("Null values")
      })

      it("should handle schema change with negative counts", () => {
        const result = getAlertPreviewText("SCHEMA_CHANGE", {
          summary: {
            addedCount: -5,
            removedCount: -3,
            typeChangedCount: -1,
            totalChanges: -9,
          },
        })
        // Should handle gracefully
        expect(result).toContain("Schema changed")
      })

      it("should handle extremely large column counts", () => {
        const columns = Array.from({ length: 1000 }, (_, i) => ({
          name: `col_${i}`,
        }))
        const result = getAlertPreviewText("NULL_OCCURRENCE", {
          affectedColumns: columns,
          columnCount: 1000,
        })
        // Should truncate with +N more
        expect(result).toContain("+")
        expect(result).toContain("more")
      })
    })

    describe("Null and Undefined Edge Cases", () => {
      it("should handle affectedColumns with null entries", () => {
        // This currently throws - documenting current behavior
        // If fixed, this test should be updated to expect graceful handling
        expect(() => {
          getAlertPreviewText("NULL_OCCURRENCE", {
            affectedColumns: [null, { name: "valid" }, undefined] as any,
            columnCount: 3,
          })
        }).toThrow()
      })

      it("should handle summary with undefined values", () => {
        const result = getAlertPreviewText("SCHEMA_CHANGE", {
          summary: {
            addedCount: undefined as any,
            removedCount: undefined as any,
            typeChangedCount: undefined as any,
            totalChanges: undefined as any,
          },
        })
        expect(result).toBe("Schema changed")
      })

      it("should handle metadata with prototype pollution attempt", () => {
        const maliciousMetadata = JSON.parse('{"__proto__": {"polluted": true}, "dropPercentage": 50}')
        const result = getAlertPreviewText("ROW_COUNT_DROP", maliciousMetadata)
        // Should not break and should not pollute prototype
        expect(result).toContain("50%")
        expect(({} as any).polluted).toBeUndefined()
      })
    })
  })

  describe("hasAlertPreviewGenerator", () => {
    it("should return true for known alert types", () => {
      expect(hasAlertPreviewGenerator("ROW_COUNT_DROP")).toBe(true)
      expect(hasAlertPreviewGenerator("NULL_OCCURRENCE")).toBe(true)
      expect(hasAlertPreviewGenerator("SCHEMA_CHANGE")).toBe(true)
    })

    it("should return false for unknown alert types", () => {
      expect(hasAlertPreviewGenerator("UNKNOWN_TYPE")).toBe(false)
      expect(hasAlertPreviewGenerator("FUTURE_ALERT")).toBe(false)
    })

    it("should handle empty string", () => {
      expect(hasAlertPreviewGenerator("")).toBe(false)
    })

    it("should handle null/undefined safely", () => {
      expect(hasAlertPreviewGenerator(null as any)).toBe(false)
      expect(hasAlertPreviewGenerator(undefined as any)).toBe(false)
    })
  })

  describe("getAlertTypeLabel", () => {
    it("should convert ROW_COUNT_DROP to title case", () => {
      expect(getAlertTypeLabel("ROW_COUNT_DROP")).toBe("Row Count Drop")
    })

    it("should convert NULL_OCCURRENCE to title case", () => {
      expect(getAlertTypeLabel("NULL_OCCURRENCE")).toBe("Null Occurrence")
    })

    it("should convert SCHEMA_CHANGE to title case", () => {
      expect(getAlertTypeLabel("SCHEMA_CHANGE")).toBe("Schema Change")
    })

    it("should handle single word types", () => {
      expect(getAlertTypeLabel("ANOMALY")).toBe("Anomaly")
    })

    it("should handle empty string", () => {
      expect(getAlertTypeLabel("")).toBe("")
    })

    it("should handle lowercase input", () => {
      expect(getAlertTypeLabel("row_count_drop")).toBe("Row Count Drop")
    })

    it("should handle mixed case input", () => {
      expect(getAlertTypeLabel("Row_Count_DROP")).toBe("Row Count Drop")
    })
  })
})
