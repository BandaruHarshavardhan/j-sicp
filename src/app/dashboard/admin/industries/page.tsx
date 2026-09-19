import { prisma } from "@/lib/prisma"
import { Building2, Handshake, CheckCircle2 } from "lucide-react"

export default async function AdminIndustriesPage() {
  const industries = await prisma.user.findMany({
    where: { role: "INDUSTRY" },
    include: {
      _count: {
        select: {
          industryCollaborations: true,
        }
      },
      industryCollaborations: {
        include: { solution: true }
      }
    }
  })

  // To count accepted solutions accurately: IndustrySupport
  const supports = await prisma.industrySupport.findMany({
    select: { industryId: true }
  })

  const enrichedIndustries = industries.map(ind => {
    const indSupports = supports.filter(s => s.industryId === ind.id)
    return {
      ...ind,
      supportedSolutionsCount: indSupports.length,
      activeCollaborationsCount: ind._count.industryCollaborations
    }
  }).sort((a, b) => b.supportedSolutionsCount - a.supportedSolutionsCount)

  const totalIndustries = enrichedIndustries.length
  const activeIndustries = enrichedIndustries.filter(i => i.supportedSolutionsCount > 0).length

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Industry Engagement</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor corporate and industry partner participation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500 leading-tight">Total Industry Partners</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600"><Building2 size={16} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">{totalIndustries}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500 leading-tight">Active Partners (Supporting Solutions)</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50 text-green-600"><CheckCircle2 size={16} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">{activeIndustries}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-slate-500 leading-tight">Total Supported Solutions</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-teal-50 text-teal-600"><Handshake size={16} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-2">{supports.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">Industry Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Industry Partner</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Solutions Supported</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Active Collaborations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrichedIndustries.map(ind => (
                <tr key={ind.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <p className="font-bold text-slate-900 text-sm">{ind.organization || ind.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Joined {new Date(ind.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{ind.email}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm">
                      {ind.supportedSolutionsCount}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 text-teal-700 font-bold text-sm">
                      {ind.activeCollaborationsCount}
                    </span>
                  </td>
                </tr>
              ))}
              {enrichedIndustries.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 text-sm">No industry partners found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
