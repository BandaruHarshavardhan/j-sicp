"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"

export function VerifyForm({ challengeId, solutionId, collaborationId }: { challengeId: string, solutionId: string, collaborationId?: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionType, setActionType] = useState<"verify" | "reject" | null>(null)

  const handleAction = async (type: "verify" | "reject") => {
    if (!confirm(`Are you sure you want to ${type === 'verify' ? 'mark this challenge as RESOLVED' : 'reject this verification and send it back to IN PROGRESS'}?`)) {
      return
    }

    setIsSubmitting(true)
    setActionType(type)
    
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          solutionId,
          collaborationId,
          action: type
        })
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert("Failed to perform action")
      }
    } catch (e) {
      alert("Error submitting request")
    } finally {
      setIsSubmitting(false)
      setActionType(null)
    }
  }

  return (
    <div className="flex gap-3">
      <button 
        onClick={() => handleAction('verify')}
        disabled={isSubmitting}
        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
      >
        <CheckCircle2 size={18} />
        {isSubmitting && actionType === 'verify' ? 'Processing...' : 'Verify & Resolve'}
      </button>
      <button 
        onClick={() => handleAction('reject')}
        disabled={isSubmitting}
        className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
      >
        <XCircle size={18} />
        {isSubmitting && actionType === 'reject' ? 'Processing...' : 'Request More Info'}
      </button>
    </div>
  )
}
