"use client"

import dynamic from "next/dynamic"

const PhoneStage = dynamic(
  () => import("@/components/phone/phone-stage").then((mod) => mod.PhoneStage),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0a14]">
        <div className="text-[12px] uppercase tracking-[0.3em] text-[#7a6fa0]">
          loading...
        </div>
      </div>
    )
  }
)

export default function Page() {
  return <PhoneStage />
}
