import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { BackButton } from "@/components/BackButton"
import { MapPin, Clock, AlertTriangle, Users, Target, Building2, CheckCircle2, Bot, ArrowRight, Lightbulb } from "lucide-react"

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      reporter: { select: { name: true, email: true } },
      aiAnalysis: true,
      solutions: {
        include: {
          progressUpdates: { orderBy: { createdAt: 'desc' } },
          industrySupport: { include: { industry: { select: { name: true, organization: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!challenge) {
    notFound()
  }

  const isInstitution = session?.user?.role === "INSTITUTION"
  const isIndustry = session?.user?.role === "INDUSTRY"
  const isAdmin = session?.user?.role === "ADMIN"

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SUBMITTED': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'UNDER_REVIEW': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'ASSIGNED': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'SOLUTION_PROPOSED': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'INDUSTRY_SUPPORT_PENDING': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'INDUSTRY_ACCEPTED': return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'RESOLVED': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null
    let color = 'bg-slate-100 text-slate-700'
    if (severity === 'High') color = 'bg-orange-100 text-orange-700'
    if (severity === 'Critical') color = 'bg-red-100 text-red-700'
    if (severity === 'Medium') color = 'bg-yellow-100 text-yellow-700'
    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${color}`}>{severity} Priority</span>
  }

  let stakeholders: string[] = []
  let aiSolutions: string[] = []
  
  try {
    if (challenge.aiAnalysis?.suggestedStakeholders) {
      stakeholders = JSON.parse(challenge.aiAnalysis.suggestedStakeholders)
    }
    if (challenge.aiAnalysis?.suggestedSolutions) {
      aiSolutions = JSON.parse(challenge.aiAnalysis.suggestedSolutions)
    }
  } catch (e) {}

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <BackButton fallback="/explore" />
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/explore" className="hover:text-primary transition">Explore</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">{challenge.aiAnalysis?.category || challenge.category || "Challenge"}</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 md:p-10 border-b border-slate-100 relative">
            {/* Header section */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(challenge.status)}`}>
                {challenge.status.replace('_', ' ')}
              </span>
              {getSeverityBadge(challenge.aiAnalysis?.severity)}
              <div className="ml-auto flex flex-col md:items-end text-sm text-slate-500 gap-2">
                <div className="flex items-center gap-1.5 whitespace-nowrap"><Clock size={16} /> {new Date(challenge.createdAt).toLocaleDateString()}</div>
                <div className="flex items-center gap-1.5 text-right"><MapPin size={16} className="shrink-0" /> {challenge.location}</div>
                {challenge.address && (
                  <div className="flex items-start gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs max-w-sm text-right">
                    <span className="shrink-0">📍</span> 
                    <span>GPS: {challenge.address}</span>
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">{challenge.title}</h1>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                {challenge.reporter.name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">Reported by {challenge.reporter.name}</div>
                <div className="text-xs text-slate-500">Citizen</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left Column - Details */}
            <div className="md:col-span-2 p-6 md:p-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Description</h2>
              <div className="prose prose-slate max-w-none text-slate-600 mb-10 whitespace-pre-wrap">
                {challenge.description}
              </div>

              {challenge.imageUrl && (
                <div className="mb-10">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Media Evidence</h3>
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <img src={challenge.imageUrl} alt="Evidence" className="w-full h-auto object-cover max-h-96" />
                  </div>
                </div>
              )}

              {/* Solutions section */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" /> Proposed Solutions
                </h2>
                
                {challenge.solutions.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">No solutions yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-6">This challenge is waiting for an institution or industry partner to propose a solution.</p>
                    {isInstitution && (
                      <Link href={`/challenge/${challenge.id}/propose`} className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white bg-primary hover:bg-primary/90 transition">
                        Submit a Proposal
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {challenge.solutions.map((solution) => (
                      <div key={solution.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="p-6 bg-white">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">{solution.title}</h3>
                              <p className="text-sm text-slate-500 mt-1">Proposed on {new Date(solution.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              solution.status === 'INDUSTRY_ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' : 
                              solution.status === 'PROPOSED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {solution.status}
                            </span>
                          </div>
                          
                          <div className="text-slate-700 mb-6">{solution.description}</div>
                          
                          <div className="grid sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Resources</div>
                              <div className="text-sm font-medium text-slate-900">{solution.resources}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Timeline & Cost</div>
                              <div className="text-sm font-medium text-slate-900">{solution.timeline} • {solution.estimatedCost || 'N/A'}</div>
                            </div>
                          </div>
                          
                          {(solution.documentUrl || solution.pptUrl) && (
                            <div className="flex gap-3 mb-6">
                              {solution.documentUrl && (
                                <a href={solution.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                  View Proposal PDF
                                </a>
                              )}
                              {solution.pptUrl && (
                                <a href={solution.pptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                                  View Presentation
                                </a>
                              )}
                            </div>
                          )}

                          {solution.industrySupport && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6">
                              <div className="flex items-center gap-2 mb-4">
                                <Building2 size={20} className="text-secondary" />
                                <h4 className="font-bold text-slate-900">Industry Partner Support</h4>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="block text-slate-500 mb-1">Partner Organization</span>
                                  <span className="font-medium text-slate-900">{solution.industrySupport.industry.organization || solution.industrySupport.industry.name}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-500 mb-1">Type of Support</span>
                                  <span className="font-medium text-slate-900">{solution.industrySupport.supportType}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-500 mb-1">Committed Contribution</span>
                                  <span className="font-medium text-slate-900">{solution.industrySupport.contribution}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-500 mb-1">Timeline</span>
                                  <span className="font-medium text-slate-900">{new Date(solution.industrySupport.startDate).toLocaleDateString()} - {new Date(solution.industrySupport.completionDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-slate-200 text-right">
                                <Link href={`/challenge/${challenge.id}/solution/${solution.id}`} className="text-sm font-bold text-primary hover:text-primary/80 transition">
                                  View Full Implementation &rarr;
                                </Link>
                              </div>
                            </div>
                          )}

                          {isIndustry && solution.status === 'PROPOSED' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-blue-900">Support this Solution</h4>
                                <p className="text-sm text-blue-700 mt-1">Provide funding, technology, or resources to help implement this solution.</p>
                              </div>
                              <Link href={`/challenge/${challenge.id}/solution/${solution.id}/support`} className="shrink-0 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
                                Accept & Support
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* Progress Timeline */}
                        {solution.progressUpdates.length > 0 && (
                          <div className="bg-slate-50 p-6 border-t border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-4">Implementation Progress</h4>
                            <div className="space-y-4">
                              {solution.progressUpdates.map((update, i) => (
                                <div key={update.id} className="flex gap-4 relative">
                                  {i !== solution.progressUpdates.length - 1 && (
                                    <div className="absolute top-8 bottom-[-16px] left-[15px] w-0.5 bg-slate-200"></div>
                                  )}
                                  <div className="w-8 h-8 rounded-full bg-white border-2 border-primary flex items-center justify-center z-10 shrink-0 text-xs font-bold text-primary">
                                    {update.percentage}%
                                  </div>
                                  <div className="pt-1.5 pb-2">
                                    <div className="text-sm text-slate-900">{update.description}</div>
                                    <div className="text-xs text-slate-500 mt-1">{new Date(update.createdAt).toLocaleDateString()}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isInstitution && challenge.status !== 'RESOLVED' && (
                      <div className="text-center pt-4">
                        <Link href={`/challenge/${challenge.id}/propose`} className="inline-flex items-center px-6 py-3 border border-slate-300 text-sm font-bold rounded-xl shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition">
                          Submit Another Proposal
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - AI Analysis */}
            <div className="bg-slate-900 text-white p-6 md:p-10 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Bot size={150} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg">
                    <Bot className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Analysis</h2>
                    <p className="text-xs text-slate-400">Powered by Google Gemini</p>
                  </div>
                </div>

                <div className="space-y-8 flex-1">
                  {challenge.aiAnalysis ? (
                    <>
                      <div>
                        <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-2"><Target size={14}/> Problem Brief</div>
                        <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-secondary/50 pl-3 py-1">
                          {challenge.aiAnalysis.problemBrief}
                        </p>
                      </div>

                      {challenge.aiAnalysis.priorityReason && (
                        <div>
                          <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Priority Reason</div>
                          <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-secondary/50 pl-3 py-1">
                            {challenge.aiAnalysis.priorityReason}
                          </p>
                        </div>
                      )}

                      <div>
                        <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Impact Assessment</div>
                        <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-secondary/50 pl-3 py-1">
                          {challenge.aiAnalysis.impact}
                        </p>
                      </div>

                      {stakeholders.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><Users size={14}/> Suggested Stakeholders</div>
                          <div className="flex flex-wrap gap-2">
                            {stakeholders.map((s, i) => (
                              <span key={i} className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs font-medium text-slate-200">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiSolutions.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><Lightbulb size={14}/> Possible Solutions</div>
                          <ul className="space-y-2">
                            {aiSolutions.map((s, i) => (
                              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <ArrowRight size={14} className="text-secondary shrink-0 mt-0.5" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-4 border-secondary/30 border-t-secondary animate-spin mb-4"></div>
                        <p className="text-slate-400">AI is analyzing this challenge...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
