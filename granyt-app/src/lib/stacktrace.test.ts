import { describe, it, expect } from "vitest"
import { isUserCode, filterUserStacktrace, type StackFrame } from "./stacktrace"

describe("stacktrace filtering", () => {
  it("should identify user code correctly", () => {
    expect(isUserCode("/opt/airflow/dags/my_dag.py")).toBe(true)
    expect(isUserCode("C:\\Users\\john\\projects\\my_script.py")).toBe(true)
    expect(isUserCode("/usr/local/lib/python3.10/site-packages/requests/api.py")).toBe(false)
    expect(isUserCode("/usr/local/lib/python3.10/dist-packages/pandas/core/frame.py")).toBe(false)
    expect(isUserCode("/usr/lib/python3.10/json/decoder.py")).toBe(false)
    expect(isUserCode("<frozen importlib._bootstrap>")).toBe(false)
    expect(isUserCode("/home/user/venv/lib/python3.10/site-packages/flask/app.py")).toBe(false)
    expect(isUserCode("/home/user/.venv/lib/python3.10/site-packages/flask/app.py")).toBe(false)
    expect(isUserCode("/opt/airflow/granyt_sdk/client.py")).toBe(false)
  })

  it("should filter stacktrace to only include user code", () => {
    const stacktrace: StackFrame[] = [
      { filename: "/usr/lib/python3.10/json/decoder.py", function: "decode", lineno: 10 },
      { filename: "/opt/airflow/dags/my_dag.py", function: "process_data", lineno: 25 },
      { filename: "/usr/local/lib/python3.10/site-packages/requests/api.py", function: "get", lineno: 50 },
      { filename: "/opt/airflow/dags/utils.py", function: "helper", lineno: 5 },
    ]

    const filtered = filterUserStacktrace(stacktrace)
    expect(filtered).toHaveLength(2)
    expect(filtered[0].filename).toBe("/opt/airflow/dags/my_dag.py")
    expect(filtered[1].filename).toBe("/opt/airflow/dags/utils.py")
  })

  it("should return empty array for null or empty stacktrace", () => {
    expect(filterUserStacktrace(null)).toEqual([])
    expect(filterUserStacktrace([])).toEqual([])
  })
})
