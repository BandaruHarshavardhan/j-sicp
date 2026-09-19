import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Activity, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"

export default async function AdminProjectsPage() {
  const projects = await prisma.solutionProposal.findMany({
    where: { 
      collaboration: { isNot: null }
    },
    include: {
      collaboration: {
        include: {
          university: { select: { name: true, organization: true } },
          industry: { select: { name: true, organization: true } }
        }
      },
      progressUpdates: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  let totalProgress = 0
  let nearingCompletion = 0
  let delayedProjects: any[] = []

  const activeProjects = projects.filter(p => p.status !== "RESOLVED")

  activeProjects.forEach(p => {
    const latest = p.progressUpdates[0]
    if (latest) {
      totalProgress += latest.percentage
      if (latest.percentage >= 80 && latest.percentage < 100) {
        nearingCompletion++
      }
      
      // Calculate delay (if last update was more than 30 days ago, or if status contains 'delay')
      const daysSinceUpdate = (new Date().getTime() - new Date(latest.createdAt).getTime()) / (1000 * 3600 * 24)
      const hasIssues = latest.issuesRisks && latest.issuesRisks.length > 5
      const isDelayedStatus = latest.status?.toLowerCase().includes('delay')
      
      if (daysSinceUpdate > 30 || hasIssues || isDelayedStatus) {
        delayedProjects.push({ ...p, daysSinceUpdate, issues: latest.issuesRisks || "No recent updates" })
      }
    }
  })

  const averageProgress = activeProjects.length > 0 ? Math.round(totalProgress / activeProjects.length) : 0

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Progress</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor implementation milestones and track delays.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Active Projects</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{activeProjects.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Average Progress</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{averageProgress}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Nearing Completion</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{nearingCompletion}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-200 bg-red-50/30">
          <p className="text-sm font-semibold text-red-600">Delayed / At Risk</p>
          <p className="text-3xl font-bold text-red-700 mt-2">{delayedProjects.length}</p>
        </div>
      </div>

      {delayedProjects.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm">
          <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> Attention Required
          </h2>
          <div className="space-y-4">
            {delayedProjects.map(dp => (
              <div key={dp.id} className="bg-white p-4 rounded-lg shadow-sm border border-red-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900">{dp.title}</h3>
                  <p className="text-sm text-red-700 mt-1">{dp.issues}</p>
                </div>
                <Link href={`/collaboration/${dp.collaboration.id}`} className="px-4 py-2 bg-red-100 text-red-700 text-sm font-bold rounded-lg hover:bg-red-200 transition shrink-0">
                  Review Project
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">All Active Projects</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {activeProjects.map(p => {
            const latest = p.progressUpdates[0]
            const collab = p.collaboration!
            return (
              <div key={p.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{p.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-slate-500">Univ:</span> <span className="font-semibold text-slate-700">{collab.university.organization || collab.university.name}</span></div>
                    <div><span className="text-slate-500">Industry:</span> <span className="font-semibold text-slate-700">{collab.industry.organization || collab.industry.name}</span></div>
                    {latest?.milestone && <div><span className="text-slate-500">Milestone:</span> <span className="font-semibold text-slate-700">{latest.milestone}</span></div>}
                    <div><span className="text-slate-500">Status:</span> <span className="font-semibold text-slate-700">{latest?.status || p.status}</span></div>
                    <div><span className="text-slate-500">Last Update:</span> <span className="font-semibold text-slate-700">{latest ? new Date(latest.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                  </div>
                </div>
                
                <div className="w-full md:w-48 shrink-0">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Progress</span>
                    <span className="text-primary">{latest?.percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${latest?.percentage || 0}%` }}></div>
                  </div>
                  <Link href={`/collaboration/${collab.id}`} className="w-full flex items-center justify-center gap-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition">
                    View Project
                  </Link>
                </div>
              </div>
            )
          })}
          {activeProjects.length === 0 && (
            <div className="p-8 text-center text-slate-500">No active projects to monitor.</div>
          )}
        </div>
      </div>
    </div>
  )
}
