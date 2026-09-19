import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Handshake, ArrowRight } from "lucide-react"

export default async function AdminCollaborationsPage() {
  const collaborations = await prisma.collaboration.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      university: { select: { name: true, organization: true } },
      industry: { select: { name: true, organization: true } },
      solution: { 
        include: { 
          industrySupport: true,
          progressUpdates: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        } 
      },
      challenge: { select: { title: true } }
    }
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Collaborations</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor partnerships between universities and industries.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Partnership</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Solution / Challenge</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Support Type</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status & Progress</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collaborations.map(collab => {
                const latestUpdate = collab.solution.progressUpdates[0]
                return (
                  <tr key={collab.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="flex flex-col space-y-1 text-sm">
                        <div className="font-bold text-indigo-700 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          {collab.university.organization || collab.university.name}
                        </div>
                        <div className="text-slate-400 text-xs pl-4">↔</div>
                        <div className="font-bold text-teal-700 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          {collab.industry.organization || collab.industry.name}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 max-w-[250px]">
                      <p className="font-bold text-slate-900 text-sm truncate" title={collab.solution.title}>{collab.solution.title}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate" title={collab.challenge.title}>For: {collab.challenge.title}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-slate-700">
                        {collab.solution.industrySupport?.supportType || 'General Support'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                          {collab.status.replace('_', ' ')}
                        </span>
                        {latestUpdate ? (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${latestUpdate.percentage}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-700">{latestUpdate.percentage}%</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 mt-2">No progress yet</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/collaboration/${collab.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition border border-indigo-200">
                        View <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {collaborations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                    No active collaborations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
