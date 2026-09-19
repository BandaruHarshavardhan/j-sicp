import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Search, Filter, ArrowRight } from "lucide-react"

export default async function AdminChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; domain?: string }>
}) {
  const { q, status, domain } = await searchParams
  
  const where: any = {}
  
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { location: { contains: q } },
      { city: { contains: q } },
      { district: { contains: q } },
      { state: { contains: q } }
    ]
  }
  if (status && status !== "ALL") {
    where.status = status
  }
  if (domain && domain !== "ALL") {
    where.category = domain
  }

  const challenges = await prisma.challenge.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      solutions: {
        include: {
          collaboration: {
            include: {
              university: { select: { name: true, organization: true } },
              industry: { select: { name: true, organization: true } }
            }
          },
          progressUpdates: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }
    }
  })

  // Get distinct categories for filter
  const categoriesRaw = await prisma.challenge.findMany({
    select: { category: true },
    distinct: ['category']
  })
  const categories = categoriesRaw.map(c => c.category).filter(Boolean)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Challenge Monitoring</h1>
          <p className="text-slate-500 text-sm mt-1">Track the lifecycle of all reported challenges.</p>
        </div>
      </div>

      {/* Filters (Client side navigation approach usually better, but for MVP server side via links or forms works) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <form className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input 
                name="q"
                defaultValue={q}
                placeholder="Search title, location..." 
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
            <select name="status" defaultValue={status || "ALL"} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="SOLUTION_PROPOSED">Solution Proposed</option>
              <option value="INDUSTRY_ACCEPTED">Industry Accepted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="VERIFICATION">Verification</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Domain</label>
            <select name="domain" defaultValue={domain || "ALL"} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              <option value="ALL">All Domains</option>
              {categories.map(c => (
                <option key={c!} value={c!}>{c}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition">
            Filter
          </button>
          <Link href="/dashboard/admin/challenges" className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition">
            Reset
          </Link>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Challenge</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Location / Domain</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">University & Industry</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Progress</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challenges.map(c => {
                const solution = c.solutions[0] // Taking the most active solution
                const collab = solution?.collaboration
                const latestUpdate = solution?.progressUpdates?.[0]

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 max-w-[200px]">
                      <p className="font-bold text-slate-900 text-sm truncate" title={c.title}>{c.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 font-medium truncate max-w-[150px]" title={c.location}>{c.location.split(',')[0]}</p>
                      <p className="text-xs text-slate-500 mt-1">{c.category || 'Uncategorized'}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      {collab ? (
                        <div className="text-xs space-y-1">
                          <div className="text-indigo-700 font-semibold truncate max-w-[150px]">{collab.university.organization || collab.university.name}</div>
                          <div className="text-teal-700 font-semibold truncate max-w-[150px]">{collab.industry.organization || collab.industry.name}</div>
                        </div>
                      ) : solution ? (
                        <div className="text-xs text-indigo-700 font-semibold truncate max-w-[150px]">
                          Proposed by Univ
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None yet</span>
                      )}
                    </td>
                    <td className="p-4">
                      {latestUpdate ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${latestUpdate.percentage}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-700">{latestUpdate.percentage}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/challenge/${c.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition">
                        View <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {challenges.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                    No challenges found matching filters.
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
