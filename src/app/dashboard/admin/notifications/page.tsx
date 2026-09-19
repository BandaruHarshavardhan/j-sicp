import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Bell, FileText, CheckCircle2, Building2, Activity } from "lucide-react"

export default async function AdminNotificationsPage() {
  // Fetch recent events across the platform
  const challenges = await prisma.challenge.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { reporter: true } })
  const solutions = await prisma.solutionProposal.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { challenge: true } })
  const supports = await prisma.industrySupport.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { industry: true, solution: true } })
  const activities = await prisma.collaborationActivity.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { actor: true, collaboration: { include: { challenge: true } } } })

  // Interleave and sort
  const allEvents = [
    ...challenges.map(c => ({ type: 'CHALLENGE', date: c.createdAt, data: c })),
    ...solutions.map(s => ({ type: 'SOLUTION', date: s.createdAt, data: s })),
    ...supports.map(s => ({ type: 'SUPPORT', date: s.createdAt, data: s })),
    ...activities.map(a => ({ type: 'ACTIVITY', date: a.createdAt, data: a }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30)

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time activity feed across the ecosystem.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {allEvents.map((event, idx) => {
            let icon = <Bell size={18} className="text-slate-400" />
            let bg = "bg-slate-100"
            let title = ""
            let desc = ""
            let link = "#"

            if (event.type === 'CHALLENGE') {
              icon = <FileText size={18} className="text-blue-600" />
              bg = "bg-blue-100"
              const c = event.data as any
              title = "New Challenge Reported"
              desc = `${c.reporter.name} reported: "${c.title}" in ${c.location}`
              link = `/challenge/${c.id}`
            } else if (event.type === 'SOLUTION') {
              icon = <CheckCircle2 size={18} className="text-indigo-600" />
              bg = "bg-indigo-100"
              const s = event.data as any
              title = "New Solution Proposed"
              desc = `A university proposed a solution for "${s.challenge.title}"`
              link = `/challenge/${s.challengeId}/solution/${s.id}`
            } else if (event.type === 'SUPPORT') {
              icon = <Building2 size={18} className="text-emerald-600" />
              bg = "bg-emerald-100"
              const s = event.data as any
              title = "Industry Support Confirmed"
              desc = `${s.industry.organization || s.industry.name} accepted solution for "${s.solution.title}"`
              link = `/challenge/${s.solution.challengeId}/solution/${s.solutionId}`
            } else if (event.type === 'ACTIVITY') {
              icon = <Activity size={18} className="text-purple-600" />
              bg = "bg-purple-100"
              const a = event.data as any
              title = "Collaboration Update"
              desc = `${a.actor.organization || a.actor.name}: ${a.description}`
              link = `/collaboration/${a.collaborationId}`
            }

            return (
              <div key={`${event.type}-${idx}`} className="p-5 hover:bg-slate-50 transition flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <span className="text-xs text-slate-400 shrink-0 ml-4">{new Date(event.date).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{desc}</p>
                  <Link href={link} className="inline-block text-xs font-bold text-primary mt-2 hover:underline">
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            )
          })}
          {allEvents.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No recent notifications.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
