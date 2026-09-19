"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter()

  return (
    <button 
      onClick={() => {
        if (window.history.length > 2) {
          router.back()
        } else {
          router.push(fallback)
        }
      }}
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition mb-6"
    >
      <ArrowLeft size={16} />
      Back
    </button>
  )
}
