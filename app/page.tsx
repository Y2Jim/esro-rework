"use client"

import dynamic from "next/dynamic"

const PhoneStage = dynamic(
  () => import("@/components/phone/phone-stage").then((mod) => mod.PhoneStage),
  { ssr: false }
)

export default function Page() {
  return <PhoneStage />
}
