import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { PostUpdateModal } from "@/components/PostUpdateModal"
import { BackButton } from "@/components/BackButton"
import { ArrowLeft, Target, Building2, Briefcase, Calendar, CheckCircle2 } from "lucide-react"

export default async function SolutionTrackingPage({ params }: { params: Promise<{ id: string, solutionId: string }> }) {
  const session = await auth()
  if (!session) {
    redirect("/auth/login")
  }
  
  const { id, solutionId } = await params
  
  const solution = await prisma.solutionProposal.findUnique({
    where: { id: solutionId },
    include: {
      challenge: true,
      progressUpdates: { 
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, organization: true } } }
      },
      industrySupport: {
        include: {
          industry: { select: { name: true, organization: true } }
        }
      },
      aiSolutionAnalysis: true,
      aiImplementationPlan: true,
      aiProgressSummary: true,
      collaboration: true
    }
  })

  if (!solution || solution.challengeId !== id) {
    notFound()
  }

  const institution = await prisma.user.findUnique({
    where: { id: solution.organizationId },
    select: { name: true, organization: true }
  })

  const isOwner = session.user.id === solution.organizationId || (solution.industrySupport && session.user.id === solution.industrySupport.industryId)
  const isAdmin = session.user.role === 'ADMIN'
  const canUpdate = isOwner || isAdmin

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <BackButton fallback={`/challenge/${id}`} />
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 border border-white/20">
                  {solution.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Implementation Tracking</h1>
              <p className="text-slate-300">Solution: {solution.title}</p>
            </div>
            
            {solution.collaboration && (
              <Link href={`/collaboration/${solution.collaboration.id}`} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-2">
                💬 Open Collaboration
              </Link>
            )}
            {!solution.collaboration && solution.industrySupport && canUpdate && (
              <Link href={`/collaboration/new?solutionId=${solution.id}`} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-2">
                💬 Start Collaboration
              </Link>
            )}
          </div>

          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-6 md:p-10">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <Building2 size={20} />
                <h3 className="font-bold text-slate-900">University / Institution</h3>
              </div>
              <p className="font-medium text-lg text-slate-900 mb-2">{institution?.organization || institution?.name}</p>
              <p className="text-sm text-slate-500 mb-6">Proposed the solution methodology and implementation strategy.</p>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Required Resources</span>
                  <span className="text-sm font-medium text-slate-900">{solution.resources}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Timeline & Cost</span>
                  <span className="text-sm font-medium text-slate-900">{solution.timeline} • {solution.estimatedCost || 'N/A'}</span>
                </div>
                {solution.documentUrl && (
                  <div className="pt-2">
                    <a href={solution.documentUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-red-600 hover:underline">View Proposal PDF &rarr;</a>
                  </div>
                )}
              </div>

              {solution.aiSolutionAnalysis && (
                <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">AI Analysis</span>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div><span className="font-semibold text-indigo-900 block mb-0.5">Problem Alignment</span> <span className="text-indigo-800">{solution.aiSolutionAnalysis.problemAlignment}</span></div>
                    <div><span className="font-semibold text-indigo-900 block mb-0.5">Expected Impact</span> <span className="text-indigo-800">{solution.aiSolutionAnalysis.expectedImpact}</span></div>
                    <div><span className="font-semibold text-indigo-900 block mb-0.5">Feasibility</span> <span className="text-indigo-800">{solution.aiSolutionAnalysis.feasibility}</span></div>
                    <div><span className="font-semibold text-indigo-900 block mb-0.5">Implementation Risks</span> <span className="text-indigo-800">{solution.aiSolutionAnalysis.implementationRisks}</span></div>
                    <div><span className="font-semibold text-indigo-900 block mb-0.5">Suggested Improvements</span> <span className="text-indigo-800">{solution.aiSolutionAnalysis.suggestedImprovements}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 md:p-10">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <Briefcase size={20} />
                <h3 className="font-bold text-slate-900">Industry Partner</h3>
              </div>
              
              {solution.industrySupport ? (
                <>
                  <p className="font-medium text-lg text-slate-900 mb-2">
                    {solution.industrySupport.industry.organization || solution.industrySupport.industry.name}
                  </p>
                  <p className="text-sm text-slate-500 mb-6">Accepted the proposal and providing necessary support.</p>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Support Type</span>
                      <span className="text-sm font-medium text-slate-900">{solution.industrySupport.supportType}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Commitment</span>
                      <span className="text-sm font-medium text-slate-900">{solution.industrySupport.contribution}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1"><Calendar size={12}/> Dates</span>
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(solution.industrySupport.startDate).toLocaleDateString()} to {new Date(solution.industrySupport.completionDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {solution.aiImplementationPlan && (
                    <div className="mt-6 bg-purple-50 border border-purple-100 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">AI Suggested Roadmap</span>
                      </div>
                      <div className="space-y-4">
                        {(() => {
                          try {
                            const phases = JSON.parse(solution.aiImplementationPlan.roadmap)
                            return phases.map((phase: any, i: number) => (
                              <div key={i}>
                                <h4 className="text-sm font-bold text-purple-900 mb-1">{phase.title}</h4>
                                <ul className="list-disc pl-4 text-xs text-purple-800 space-y-1">
                                  {phase.tasks.map((task: string, j: number) => (
                                    <li key={j}>{task}</li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          } catch (e) {
                            return null
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Briefcase size={32} className="text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-900">No Industry Partner yet</p>
                  <p className="text-xs text-slate-500 mt-1">Waiting for an industry to accept and support this solution.</p>
                  
                  {solution.aiSolutionAnalysis && (
                    <div className="mt-6 text-left w-full">
                      <h4 className="text-sm font-bold text-slate-700 mb-2">AI Suggested Industry Partners</h4>
                      <div className="space-y-2">
                        {(() => {
                          try {
                            const industries = JSON.parse(solution.aiSolutionAnalysis.suggestedIndustries)
                            if (industries.length === 0) return <p className="text-xs text-slate-500">None identified yet.</p>
                            return industries.map((ind: any, i: number) => (
                              <div key={i} className="bg-white p-3 rounded border border-slate-200">
                                <div className="text-xs font-bold text-indigo-700 mb-1">Match</div>
                                <div className="text-xs text-slate-600">{ind.reason}</div>
                              </div>
                            ))
                          } catch { return <p className="text-xs text-slate-500">Error loading suggestions.</p> }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Timeline Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Progress Tracking</h2>
            {canUpdate && (
              <PostUpdateModal solutionId={solutionId} challengeId={id} />
            )}
          </div>
          
          <div className="p-6 md:p-10">
            {solution.aiProgressSummary && (
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">AI Progress Summary</span>
                </div>
                <p className="text-sm font-medium text-slate-800 mb-4">{solution.aiProgressSummary.summary}</p>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Next Recommended Action</span>
                    <span className="text-slate-600">{solution.aiProgressSummary.nextAction}</span>
                  </div>
                  {(() => {
                    try {
                      const risks = JSON.parse(solution.aiProgressSummary.risks)
                      if (risks.length > 0 && risks[0] !== "None" && risks[0] !== "None identified") {
                        return (
                          <div>
                            <span className="font-bold text-red-700 block mb-1">Identified Risks</span>
                            <span className="text-red-600">{risks.join(', ')}</span>
                          </div>
                        )
                      }
                      return null
                    } catch { return null }
                  })()}
                </div>
              </div>
            )}

            {solution.progressUpdates.length > 0 ? (
              <div className="space-y-6">
                {solution.progressUpdates.map((update, i) => (
                  <div key={update.id} className="flex gap-4 relative">
                    {i !== solution.progressUpdates.length - 1 && (
                      <div className="absolute top-10 bottom-[-24px] left-[19px] w-0.5 bg-slate-200"></div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-white border-4 border-primary flex items-center justify-center z-10 shrink-0 text-xs font-bold text-primary shadow-sm">
                      {update.percentage}%
                    </div>
                    <div className="pt-1.5 pb-2 flex-1">
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                        {update.title && <h3 className="font-bold text-slate-900 mb-2">{update.title}</h3>}
                        <div className="text-sm text-slate-800 whitespace-pre-wrap mb-4">{update.description}</div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-white p-3 rounded-lg border border-slate-100 mb-3">
                          {update.milestone && (
                            <div>
                              <span className="block text-slate-500 font-semibold mb-0.5 uppercase tracking-wider text-[10px]">Milestone</span>
                              <span className="font-medium text-slate-900">{update.milestone}</span>
                            </div>
                          )}
                          {update.status && (
                            <div>
                              <span className="block text-slate-500 font-semibold mb-0.5 uppercase tracking-wider text-[10px]">Status</span>
                              <span className="font-medium text-slate-900">{update.status}</span>
                            </div>
                          )}
                        </div>

                        {update.evidenceUrl && (
                          <div className="mt-3">
                            <a href={update.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition items-center gap-1">
                              <CheckCircle2 size={14} /> View Evidence
                            </a>
                          </div>
                        )}
                        <div className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                          <span>
                            Posted by <span className="font-semibold text-slate-700">{update.user?.name || 'Unknown'}</span> 
                            {update.userRole && <span className="ml-1 bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase">{update.userRole}</span>}
                          </span>
                          <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-500">No progress updates have been posted yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
