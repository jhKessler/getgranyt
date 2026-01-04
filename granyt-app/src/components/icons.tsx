import Image from "next/image"

export function AirflowIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/airflow_transparent.png"
      alt="Airflow"
      className={className}
      width={24}
      height={24}
    />
  )
}

export function DagsterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      fill="currentColor"
    >
      <path d="M128 20L236 74V182L128 236L20 182V74L128 20Z" />
      <path
        d="M128 40L216 84V172L128 216L40 172V84L128 40Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path d="M128 60L196 94V162L128 196L60 162V94L128 60Z" />
      <path
        d="M128 80L176 104V152L128 176L80 152V104L128 80Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
    </svg>
  )
}
