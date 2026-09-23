import { prisma } from "@/lib/prisma"
import { GraduationCap, FileText, CheckCircle2 } from "lucide-react"

export default async function AdminUniversitiesPage() {
  const [universities, solutions] = await Promise.all([
    prisma.user.findMany({
      where: { role: "INSTITUTION" },
      include: {
        _count: {
          select: {
            universityCollaborations: true,
          }
        },
        universityCollaborations: {
          include: { solution: true }
        }
      }
    }),
    prisma.solutionProposal.findMany({
      select: { organizationId: true, status: true }
    })
  ])

  const enrichedUnivs = universities.map(u => {
    const univSolutions = solutions.filter(s => s.organizationId === u.id)
    return {
      ...u,
      solutionsProposedCount: univSolutions.length,
      activeProjectsCount: u._count.universityCollaborations
    }
  }).sort((a, b) => b.solutionsProposedCount - a.solutionsProposedCount)

  const totalUnivs = enrichedUnivs.length
  const activeUnivs = enrichedUnivs.filter(u => u.solutionsProposedCount > 0).length

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">University Participation</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor institutional engagement across the platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500 leading-tight">Total Participating Universities</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600"><GraduationCap size={16} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">{totalUnivs}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500 leading-tight">Active Universities (Submitted Solutions)</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50 text-green-600"><CheckCircle2 size={16} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">{activeUnivs}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500 leading-tight">Total Solutions Proposed</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600"><FileText size={16} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">{solutions.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">Institution Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Institution</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Solutions Proposed</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Active Projects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrichedUnivs.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <p className="font-bold text-slate-900 text-sm">{u.organization || u.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{u.email}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm">
                      {u.solutionsProposedCount}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
                      {u.activeProjectsCount}
                    </span>
                  </td>
                </tr>
              ))}
              {enrichedUnivs.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 text-sm">No institutions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
