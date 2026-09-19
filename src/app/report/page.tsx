"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MapPin, Image as ImageIcon, Video, Upload, Send, AlertTriangle } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export default function ReportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    address: "",
    locality: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    latitude: null as number | null,
    longitude: null as number | null,
    imageUrl: "",
    videoUrl: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [locationLoading, setLocationLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false)

  // Redirect if not citizen
  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Login Required</h2>
            <p className="text-slate-600 mb-6">You must be logged in as a Citizen to report a problem.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/login" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">Login</Link>
              <Link href="/auth/register" className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">Register</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (session?.user?.role !== "CITIZEN") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Unauthorized</h2>
            <p className="text-slate-600 mb-6">Only Citizen accounts can report societal challenges.</p>
            <Link href="/" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">Go Home</Link>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGetLocation = () => {
    setLocationLoading(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          const fallbackLocation = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
          
          try {
            // Reverse Geocoding using OpenStreetMap Nominatim
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            const data = await res.json()
            
            if (data && data.address) {
              const addr = data.address
              const city = addr.city || addr.town || addr.village || ""
              const district = addr.county || addr.state_district || ""
              const state = addr.state || ""
              const locality = addr.suburb || addr.neighbourhood || addr.residential || ""
              const pincode = addr.postcode || ""

              setFormData(prev => ({ 
                ...prev, 
                address: data.display_name,
                locality,
                city,
                district,
                state,
                pincode,
                latitude: lat,
                longitude: lon
              }))
            } else {
              // Fallback to coordinates
              setFormData(prev => ({ 
                ...prev, 
                address: "COORDINATES_ONLY",
                latitude: lat,
                longitude: lon
              }))
            }
          } catch (error) {
            console.error("Reverse geocoding failed:", error)
            // Fallback to coordinates on API error
            setFormData(prev => ({ 
              ...prev, 
              address: "COORDINATES_ONLY",
              latitude: lat,
              longitude: lon
            }))
          } finally {
            setLocationLoading(false)
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationLoading(false)
          alert("Could not get your location. Please ensure you have granted GPS permissions.")
        }
      )
    } else {
      setLocationLoading(false)
      alert("Geolocation is not supported by your browser.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // 1. Check for duplicates first if not ignored
      if (!ignoreDuplicates && formData.title.length > 10 && formData.description.length > 20) {
        const dupRes = await fetch("/api/challenges/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: formData.title, description: formData.description })
        })
        if (dupRes.ok) {
          const dupData = await dupRes.json()
          if (dupData.duplicates && dupData.duplicates.length > 0) {
            setDuplicates(dupData.duplicates)
            setShowDuplicateWarning(true)
            setIsSubmitting(false)
            return // Stop submission and wait for user decision
          }
        }
      }

      let uploadedImageUrl = formData.imageUrl
      let uploadedVideoUrl = formData.videoUrl

      // Upload files first if any
      if (selectedFiles.length > 0) {
        const uploadData = new FormData()
        selectedFiles.forEach(file => {
          uploadData.append("file", file)
        })

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData
        })

        if (!uploadRes.ok) {
          throw new Error("File upload failed")
        }

        const uploadResult = await uploadRes.json()
        const urls: string[] = uploadResult.urls

        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        const images = urls.filter(u => imageExts.some(ext => u.toLowerCase().endsWith(ext)))
        const videos = urls.filter(u => !imageExts.some(ext => u.toLowerCase().endsWith(ext)))

        if (images.length > 0) uploadedImageUrl = images.join(",")
        if (videos.length > 0) uploadedVideoUrl = videos.join(",")
      }

        const payload = { ...formData, imageUrl: uploadedImageUrl, videoUrl: uploadedVideoUrl }
        if (payload.address === "COORDINATES_ONLY") {
          payload.address = ""
        }

        const res = await fetch("/api/challenges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

      if (res.ok) {
        const data = await res.json()
        router.push(`/challenge/${data.challengeId}`)
      } else {
        const data = await res.json()
        setError(data.message || "Failed to submit challenge")
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-8 md:px-10 border-b border-slate-100 bg-slate-900 text-white">
            <h1 className="text-3xl font-bold">Report a Problem</h1>
            <p className="mt-2 text-slate-300">Submit a societal challenge in your community. Our AI will analyze it and help find the right stakeholders to resolve it.</p>
          </div>
          
          <div className="px-6 py-8 md:px-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertTriangle className="shrink-0 h-5 w-5 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {showDuplicateWarning && (
              <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-yellow-600 h-6 w-6" />
                  <h3 className="text-lg font-bold text-slate-900">Similar challenges found!</h3>
                </div>
                <p className="text-slate-700 mb-4 text-sm">
                  Our AI has detected that similar issues have already been reported. Please check if your problem is one of these before submitting a new one.
                </p>
                <div className="space-y-3 mb-6">
                  {duplicates.map(dup => (
                    <div key={dup.id} className="bg-white p-4 rounded-xl border border-yellow-100">
                      <div className="flex justify-between items-start mb-1">
                        <Link href={`/challenge/${dup.id}`} target="_blank" className="font-semibold text-primary hover:underline">
                          {dup.title}
                        </Link>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">
                          {dup.similarityPercentage}% Similar
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">{dup.location} • {dup.category} • Status: {dup.status}</div>
                      <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">{dup.reason}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setIgnoreDuplicates(true)
                      setShowDuplicateWarning(false)
                      // Trigger form submit again
                      const form = document.getElementById("report-form") as HTMLFormElement
                      if (form) setTimeout(() => form.requestSubmit(), 100)
                    }}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium"
                  >
                    My problem is different, continue submitting
                  </button>
                  <button 
                    onClick={() => {
                      setShowDuplicateWarning(false)
                    }}
                    className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                  >
                    Cancel submission
                  </button>
                </div>
              </div>
            )}

            <form id="report-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Challenge Title <span className="text-red-500">*</span></label>
                <p className="text-xs text-slate-500 mb-2">Provide a short, descriptive title for the problem.</p>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                  placeholder="e.g. Broken water pipe leaking in main market"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Detailed Description <span className="text-red-500">*</span></label>
                <p className="text-xs text-slate-500 mb-2">Explain the problem, who it affects, and how long it has been occurring.</p>
                <textarea
                  name="description"
                  required
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors resize-none"
                  placeholder="Describe the issue in detail..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Category (Optional)</label>
                  <p className="text-xs text-slate-500 mb-2">Help us categorize it, or leave it to our AI.</p>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors bg-white"
                  >
                    <option value="">Let AI categorize this</option>
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Water & Sanitation">Water & Sanitation</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Environment">Environment</option>
                    <option value="Public Safety">Public Safety</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Problem Location <span className="text-red-500">*</span></label>
                  <p className="text-xs text-slate-500 mb-2">Where is this happening? Be specific (city, village, district, state).</p>
                  <div className="relative flex items-center mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <input
                      type="text"
                      name="location"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      className="block w-full pl-10 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                      placeholder="e.g. Visakhapatnam, Andhra Pradesh"
                    />
                  </div>
                  
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1">GPS Location (Optional)</label>
                      <p className="text-xs text-slate-500">Provide your current coordinates to help map the issue.</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locationLoading}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-medium rounded-lg transition disabled:opacity-50 self-start"
                    >
                      {locationLoading ? "Loading..." : "Locate Me"}
                    </button>
                    
                    {formData.latitude !== null && formData.longitude !== null && (
                      <div className="mt-2 text-sm bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        {formData.address !== "COORDINATES_ONLY" ? (
                          <>
                            <p className="text-emerald-700 font-medium mb-3 flex items-center gap-1.5">
                              <span className="text-emerald-500">✓</span> Location detected successfully
                            </p>
                            <div className="mb-3">
                              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">📍 Place:</p>
                              <p className="text-slate-900 font-medium">{formData.address}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-amber-700 font-medium mb-3 flex items-center gap-1.5">
                              <span>📍</span> GPS coordinates detected
                            </p>
                            <p className="text-amber-600 text-xs mb-3">Address could not be determined. Please enter the problem location manually.</p>
                          </>
                        )}
                        <div>
                          <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">🎯 Coordinates:</p>
                          <div className="text-slate-700 font-mono bg-slate-50 p-2 rounded border border-slate-100 space-y-1">
                            <p>Latitude: {formData.latitude.toFixed(4)}</p>
                            <p>Longitude: {formData.longitude.toFixed(4)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Media Evidence (Optional)</label>
                <p className="text-xs text-slate-500 mb-3">Upload photos or videos to help stakeholders understand the problem.</p>
                
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(Array.from(e.target.files))
                      }
                    }}
                  />
                  <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-sm font-medium text-slate-700">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Click or drag to upload photos/videos"}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">Images or Videos up to 50MB</span>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 truncate max-w-[200px]">
                        {f.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 max-w-sm">By submitting, you agree to our terms of service. Our AI will analyze your report immediately.</p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition min-w-[200px]"
                >
                  {isSubmitting ? (
                    "Analyzing with AI..."
                  ) : (
                    <>Submit Report <Send size={18} className="ml-2" /></>
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
