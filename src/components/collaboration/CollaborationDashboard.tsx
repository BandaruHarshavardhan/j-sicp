"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, User as UserIcon, Building2, Briefcase, Mail, Phone, Calendar, Clock, CheckCircle2 } from "lucide-react"
import { PostUpdateModal } from "@/components/PostUpdateModal"

export function CollaborationDashboard({ collaboration, currentUser }: { collaboration: any, currentUser: any }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [messages, setMessages] = useState(collaboration.messages)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Contacts state
  const myContact = collaboration.contacts.find((c: any) => c.userId === currentUser.id)
  const partnerContact = collaboration.contacts.find((c: any) => c.userId !== currentUser.id)
  
  const [contactForm, setContactForm] = useState({
    contactName: myContact?.contactName || "",
    officialEmail: myContact?.officialEmail || "",
    phone: myContact?.phone || "",
    department: myContact?.department || ""
  })
  const [isSavingContact, setIsSavingContact] = useState(false)

  // Scroll to bottom of messages
  useEffect(() => {
    if (activeTab === "messages") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, activeTab])

  // Simple polling for new messages (every 10s)
  useEffect(() => {
    if (activeTab !== "messages") return
    
    const interval = setInterval(async () => {
      // In a real app we'd fetch just new messages. For prototype, refresh router to get updated props.
      router.refresh()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [activeTab, router])

  // Update messages state when props change (from polling/refresh)
  useEffect(() => {
    setMessages(collaboration.messages)
  }, [collaboration.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const res = await fetch("/api/collaboration/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaborationId: collaboration.id,
          message: newMessage
        })
      })

      if (res.ok) {
        setNewMessage("")
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to send message", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingContact(true)
    try {
      const res = await fetch("/api/collaboration/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaborationId: collaboration.id,
          ...contactForm
        })
      })

      if (res.ok) {
        alert("Contact information updated successfully.")
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to save contact", error)
    } finally {
      setIsSavingContact(false)
    }
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "messages", label: "Messages" },
    { id: "contact", label: "Contact Details" },
    { id: "support", label: "Support Terms" },
    { id: "progress", label: "Progress Tracking" },
    { id: "activity", label: "Activity Timeline" }
  ]

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-900 text-white relative">
        <Link href={`/challenge/${collaboration.challengeId}/solution/${collaboration.solutionId}`} className="absolute top-8 right-8 text-sm text-slate-300 hover:text-white flex items-center">
          <ArrowLeft size={16} className="mr-1" /> Solution Details
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {collaboration.status.replace('_', ' ')}
          </span>
          <span className="text-sm text-slate-400">Collaboration ID: {collaboration.id.slice(-8).toUpperCase()}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">University-Industry Collaboration</h1>
        <p className="text-slate-300">Challenge: {collaboration.challenge.title}</p>
        
        <div className="mt-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-white/10 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">University</div>
            <div className="font-semibold text-lg">{collaboration.university.organization || collaboration.university.name}</div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
              <span className="font-bold">↔</span>
            </div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Industry Partner</div>
            <div className="font-semibold text-lg">{collaboration.industry.organization || collaboration.industry.name}</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id 
                ? "border-primary text-primary bg-primary/5" 
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8 min-h-[500px]">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Building2 size={20} className="text-primary"/> The Challenge</h3>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-sm text-slate-700">
                <p className="mb-2"><strong>Location:</strong> {collaboration.challenge.location}</p>
                <p className="mb-2"><strong>Category:</strong> {collaboration.challenge.category}</p>
                <p>{collaboration.challenge.description}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Briefcase size={20} className="text-indigo-600"/> Proposed Solution</h3>
              <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 text-sm text-slate-700">
                <p className="font-bold text-indigo-900 text-base mb-2">{collaboration.solution.title}</p>
                <p className="mb-4">{collaboration.solution.description}</p>
                <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-indigo-200/50">
                  <div><strong>Resources Required:</strong> <br/>{collaboration.solution.resources}</div>
                  <div><strong>Expected Outcome:</strong> <br/>{collaboration.solution.expectedOutcome}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === "messages" && (
          <div className="flex flex-col h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMe = msg.senderId === currentUser.id
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1 px-1">
                        <span className="text-xs font-semibold text-slate-600">
                          {msg.sender.organization || msg.sender.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                        isMe 
                          ? 'bg-primary text-white rounded-br-sm' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {currentUser.role !== 'ADMIN' && (
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-slate-800"
                />
                <button 
                  type="submit" 
                  disabled={isSending || !newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        )}

        {/* CONTACT DETAILS TAB */}
        {activeTab === "contact" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Your Contact Info</h3>
              {currentUser.role !== 'ADMIN' ? (
                <form onSubmit={handleSaveContact} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Representative Name *</label>
                    <input required type="text" value={contactForm.contactName} onChange={e => setContactForm({...contactForm, contactName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Official Email *</label>
                    <input required type="email" value={contactForm.officialEmail} onChange={e => setContactForm({...contactForm, officialEmail: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input type="text" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Department / Role</label>
                    <input type="text" value={contactForm.department} onChange={e => setContactForm({...contactForm, department: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-slate-800" />
                  </div>
                  <button type="submit" disabled={isSavingContact} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition">
                    {isSavingContact ? "Saving..." : "Save Contact Info"}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-slate-500">Admins do not need to provide contact info.</p>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Partner Contact Info</h3>
              {partnerContact ? (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{partnerContact.contactName}</div>
                      <div className="text-xs font-semibold text-slate-500 uppercase">{partnerContact.department || 'Representative'}</div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Mail size={16} className="text-slate-400" /> <a href={`mailto:${partnerContact.officialEmail}`} className="text-primary hover:underline">{partnerContact.officialEmail}</a>
                    </div>
                    {partnerContact.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone size={16} className="text-slate-400" /> {partnerContact.phone}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
                  The partner has not provided their contact details yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === "support" && (
          <div className="max-w-2xl bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" /> Agreed Support Terms
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                <div className="text-slate-500 font-semibold">Support Type</div>
                <div className="col-span-2 font-medium text-slate-900">{collaboration.solution.industrySupport?.supportType}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                <div className="text-slate-500 font-semibold">Commitment / Details</div>
                <div className="col-span-2 font-medium text-slate-900">{collaboration.solution.industrySupport?.contribution}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                <div className="text-slate-500 font-semibold">Resources Available</div>
                <div className="col-span-2 font-medium text-slate-900">{collaboration.solution.industrySupport?.resources}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-slate-500 font-semibold">Timeline</div>
                <div className="col-span-2 font-medium text-slate-900 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400"/>
                  {new Date(collaboration.solution.industrySupport?.startDate).toLocaleDateString()} &rarr; {new Date(collaboration.solution.industrySupport?.completionDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROGRESS TAB */}
        {activeTab === "progress" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Implementation Tracking</h3>
              {currentUser.role !== 'ADMIN' && (
                <PostUpdateModal solutionId={collaboration.solutionId} challengeId={collaboration.challengeId} />
              )}
            </div>

            {collaboration.solution.aiProgressSummary && (
              <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">AI Status Summary</span>
                <p className="text-sm text-indigo-900">{collaboration.solution.aiProgressSummary.summary}</p>
              </div>
            )}

            {collaboration.solution.progressUpdates.length > 0 ? (
              <div className="space-y-4">
                {collaboration.solution.progressUpdates.map((update: any) => (
                  <div key={update.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        {update.title && <h4 className="font-bold text-slate-900">{update.title}</h4>}
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <span className="font-semibold">{update.user?.organization || update.user?.name}</span>
                          <span>•</span>
                          <span className="uppercase">{update.milestone}</span>
                          <span>•</span>
                          <span className="text-slate-400">{new Date(update.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {update.percentage}%
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{update.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500">No progress updates posted yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY TIMELINE TAB */}
        {activeTab === "activity" && (
          <div className="max-w-2xl relative pl-6 border-l-2 border-slate-200 ml-4 py-4 space-y-8">
            {collaboration.activities.map((act: any, i: number) => (
              <div key={act.id} className="relative">
                <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary"></div>
                <div className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-2">
                  <Clock size={12} /> {new Date(act.createdAt).toLocaleString()}
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl text-sm shadow-sm">
                  <span className="font-semibold text-slate-800">{act.actor.organization || act.actor.name}</span>
                  <p className="text-slate-600 mt-1">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
