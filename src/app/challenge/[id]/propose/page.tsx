"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, CheckCircle2, AlertTriangle, Coins, Calendar, Package, FileText, Presentation } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export default function ProposeSolutionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const challengeId = params.id as string
  
  const [formData, setFormData] = useState({
    challengeId,
    title: "",
    description: "",
    resources: "",
    timeline: "",
    estimatedCost: ""
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [pptFile, setPptFile] = useState<File | null>(null)

  // Authentication & Authorization checks
  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  
  if (status === "unauthenticated" || session?.user?.role !== "INSTITUTION") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Unauthorized</h2>
            <p className="text-slate-600 mb-6">Only registered Institutions and Universities can propose solutions to challenges.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => router.back()} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">Go Back</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      if (!documentFile) {
        setError("PDF Document is mandatory.")
        setIsSubmitting(false)
        return
      }

      // Upload files
      const uploadData = new FormData()
      uploadData.append("file", documentFile)
      if (pptFile) {
        uploadData.append("file", pptFile)
      }

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData
      })

      if (!uploadRes.ok) {
        throw new Error("File upload failed")
      }

      const uploadResult = await uploadRes.json()
      const urls: string[] = uploadResult.urls
      
      const documentUrl = urls[0]
      const pptUrl = pptFile ? urls[1] : null

      const res = await fetch("/api/solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          documentUrl,
          pptUrl
        })
      })

      if (res.ok) {
        // Success - go back to challenge page
        router.push(`/challenge/${challengeId}`)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.message || "Failed to submit proposal")
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
          <div className="px-6 py-8 md:px-10 border-b border-slate-100 bg-primary text-white">
            <h1 className="text-2xl md:text-3xl font-bold">Propose a Solution</h1>
            <p className="mt-2 text-primary-foreground/80">Submit your organization's approach to solving this societal challenge.</p>
          </div>
          
          <div className="px-6 py-8 md:px-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertTriangle className="shrink-0 h-5 w-5 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Proposal Title <span className="text-red-500">*</span></label>
                <p className="text-xs text-slate-500 mb-2">Give your solution a clear, descriptive name.</p>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                  placeholder="e.g. Smart IoT Water Leak Detection System"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Detailed Approach <span className="text-red-500">*</span></label>
                <p className="text-xs text-slate-500 mb-2">Explain how you plan to solve the problem, step-by-step.</p>
                <textarea
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors resize-none"
                  placeholder="Describe your methodology, technology stack, or implementation plan..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5"><Package size={16} className="text-slate-500" /> Required Resources <span className="text-red-500">*</span></label>
                  <p className="text-xs text-slate-500 mb-2">Manpower, equipment, tech, etc.</p>
                  <input
                    type="text"
                    name="resources"
                    required
                    value={formData.resources}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                    placeholder="e.g. 3 Devs, IoT Sensors, Cloud Server"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5"><Calendar size={16} className="text-slate-500" /> Implementation Timeline <span className="text-red-500">*</span></label>
                  <p className="text-xs text-slate-500 mb-2">Expected duration.</p>
                  <input
                    type="text"
                    name="timeline"
                    required
                    value={formData.timeline}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                    placeholder="e.g. 3-4 Weeks"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5"><Coins size={16} className="text-slate-500" /> Estimated Cost / Funding (Optional)</label>
                <p className="text-xs text-slate-500 mb-2">Provide an estimate if you require CSR funds or government grants.</p>
                <input
                  type="text"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                  placeholder="e.g. ₹50,000 (Fully sponsored by us) OR Needs ₹2L funding"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5"><FileText size={16} className="text-red-500" /> Solution Document (PDF) <span className="text-red-500">*</span></label>
                  <p className="text-xs text-slate-500 mb-2">Mandatory. Detailed proposal document.</p>
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDocumentFile(e.target.files[0])
                      }
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5"><Presentation size={16} className="text-blue-500" /> Presentation (PPT/PPTX)</label>
                  <p className="text-xs text-slate-500 mb-2">Optional. Slide deck for your solution.</p>
                  <input
                    type="file"
                    accept=".ppt,.pptx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPptFile(e.target.files[0])
                      }
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 max-w-sm flex items-start gap-1.5">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                  Your organization's profile ({(session?.user as any)?.organization || session?.user?.name}) will be attached to this proposal.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 transition min-w-[200px]"
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>Submit Proposal <Send size={18} className="ml-2" /></>
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
