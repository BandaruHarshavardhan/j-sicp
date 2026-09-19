"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, CheckCircle2, AlertTriangle, Building2, Briefcase, FileText } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export default function IndustrySupportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const challengeId = params.id as string
  const solutionId = params.solutionId as string
  
  const [formData, setFormData] = useState({
    solutionId,
    contactPerson: "",
    supportType: "Financial & Technical",
    resources: "",
    technology: "",
    funding: "",
    personnelCount: "",
    contribution: "",
    startDate: "",
    completionDate: "",
    remarks: ""
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  // Authentication & Authorization checks
  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  
  if (status === "unauthenticated" || session?.user?.role !== "INDUSTRY") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Unauthorized</h2>
            <p className="text-slate-600 mb-6">Only registered Industry partners can commit to supporting solutions.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => router.back()} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">Go Back</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      let documentUrl = null

      if (documentFile) {
        const uploadData = new FormData()
        uploadData.append("file", documentFile)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData
        })

        if (!uploadRes.ok) {
          throw new Error("File upload failed")
        }

        const uploadResult = await uploadRes.json()
        documentUrl = uploadResult.urls[0]
      }

      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          documentUrl
        })
      })

      if (res.ok) {
        router.push(`/challenge/${challengeId}/solution/${solutionId}`)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.message || "Failed to submit support commitment")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href={`/challenge/${challengeId}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-6 transition">
          <ArrowLeft size={16} className="mr-1" /> Back to Challenge
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-8 md:px-10 border-b border-slate-100 bg-secondary text-white">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="text-white/80" />
              <h1 className="text-2xl md:text-3xl font-bold">Accept & Support Solution</h1>
            </div>
            <p className="text-white/80">Specify the resources, funding, and technology your industry will provide to implement this university solution.</p>
          </div>
          
          <div className="px-6 py-8 md:px-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertTriangle className="shrink-0 h-5 w-5 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Contact Person <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="contactPerson"
                    required
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                    placeholder="e.g. Jane Doe, CSR Lead"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Type of Support <span className="text-red-500">*</span></label>
                  <select
                    name="supportType"
                    required
                    value={formData.supportType}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                  >
                    <option value="Financial">Financial Funding</option>
                    <option value="Technical">Technical & Equipment</option>
                    <option value="Financial & Technical">Financial & Technical</option>
                    <option value="Mentorship">Mentorship & Consultation</option>
                    <option value="Logistics">Logistics & Field Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5"><Briefcase size={16} className="text-slate-500" /> Expected Contribution <span className="text-red-500">*</span></label>
                <p className="text-xs text-slate-500 mb-2">Summarize what your industry is officially committing to this solution.</p>
                <textarea
                  name="contribution"
                  required
                  rows={4}
                  value={formData.contribution}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors resize-none"
                  placeholder="We will provide ₹5,00,000 in CSR funding and 10 IoT gateway devices..."
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Resources <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="resources"
                    required
                    value={formData.resources}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors text-sm"
                    placeholder="e.g. Cloud Credits, Raw Materials"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Technology (Optional)</label>
                  <input
                    type="text"
                    name="technology"
                    value={formData.technology}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors text-sm"
                    placeholder="e.g. AWS, AI Models, Sensors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Funding (Optional)</label>
                  <input
                    type="text"
                    name="funding"
                    value={formData.funding}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors text-sm"
                    placeholder="e.g. ₹2,00,000"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Expected Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Expected Completion Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="completionDate"
                    required
                    value={formData.completionDate}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5"><FileText size={16} className="text-slate-500" /> Supporting Documents (Optional)</label>
                <p className="text-xs text-slate-500 mb-2">Upload any official CSR approval, MOU, or support letters (PDF).</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDocumentFile(e.target.files[0])
                    }
                  }}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 max-w-sm flex items-start gap-1.5">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                  By submitting, {(session?.user as any)?.organization || session?.user?.name} officially agrees to collaborate on this solution.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 transition min-w-[200px]"
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>Confirm Support <Send size={18} className="ml-2" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
