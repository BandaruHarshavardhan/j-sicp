import { prisma } from "@/lib/prisma"
import { Globe2, Users, MapPin, Zap, Lightbulb, BookOpen, Presentation, Save } from "lucide-react"

export default async function AdminImpactPage() {
  const outcomes = await prisma.projectOutcome.findMany()
  const resolvedCount = await prisma.challenge.count({ where: { status: "RESOLVED" } })

  const totals = outcomes.reduce((acc, curr) => ({
    citizensBenefited: acc.citizensBenefited + (curr.citizensBenefited || 0),
    communitiesAffected: acc.communitiesAffected + (curr.communitiesAffected || 0),
    districtsImpacted: acc.districtsImpacted + (curr.districtsImpacted || 0),
    prototypesDeveloped: acc.prototypesDeveloped + (curr.prototypesDeveloped || 0),
    solutionsDeployed: acc.solutionsDeployed + (curr.solutionsDeployed || 0),
    patentsGenerated: acc.patentsGenerated + (curr.patentsGenerated || 0),
    startupsCreated: acc.startupsCreated + (curr.startupsCreated || 0),
    researchProjects: acc.researchProjects + (curr.researchProjects || 0),
    technologyTransfers: acc.technologyTransfers + (curr.technologyTransfers || 0),
  }), {
    citizensBenefited: 0, communitiesAffected: 0, districtsImpacted: 0,
    prototypesDeveloped: 0, solutionsDeployed: 0, patentsGenerated: 0,
    startupsCreated: 0, researchProjects: 0, technologyTransfers: 0
  })

  // We should also list the resolved projects and their outcomes
  const resolvedProjects = await prisma.solutionProposal.findMany({
    where: { status: "RESOLVED" },
    include: {
      challenge: { select: { title: true, location: true } },
      collaboration: { include: { university: { select: { name: true, organization: true } }, industry: { select: { name: true, organization: true } } } },
      projectOutcome: true
    }
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Impact & Innovation Outcomes</h1>
          <p className="text-slate-500 text-sm mt-1">Measurable outcomes from verified and resolved societal challenges.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Globe2 className="text-emerald-500" /> Community Impact
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <ImpactCard title="Challenges Resolved" value={resolvedCount} icon={CheckCircle2Icon} color="emerald" />
            <ImpactCard title="Citizens Benefited" value={totals.citizensBenefited} icon={Users} color="emerald" />
            <ImpactCard title="Communities Affected" value={totals.communitiesAffected} icon={Users} color="emerald" />
            <ImpactCard title="Districts Impacted" value={totals.districtsImpacted} icon={MapPin} color="emerald" />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="text-amber-500" /> Innovation Outcomes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ImpactCard title="Prototypes" value={totals.prototypesDeveloped} icon={Lightbulb} color="amber" />
            <ImpactCard title="Solutions Deployed" value={totals.solutionsDeployed} icon={CheckCircle2Icon} color="amber" />
            <ImpactCard title="Patents Generated" value={totals.patentsGenerated} icon={BookOpen} color="amber" />
            <ImpactCard title="Startups Created" value={totals.startupsCreated} icon={Building2Icon} color="amber" />
            <ImpactCard title="Research Projects" value={totals.researchProjects} icon={BookOpen} color="amber" />
            <ImpactCard title="Tech Transfers" value={totals.technologyTransfers} icon={Presentation} color="amber" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">Verified Project Outcomes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Project / Challenge</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Partners</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Citizens Benefited</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Patents / Startups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resolvedProjects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 max-w-[200px]">
                    <p className="font-bold text-slate-900 text-sm truncate" title={p.title}>{p.title}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate" title={p.challenge.title}>For: {p.challenge.title}</p>
                  </td>
                  <td className="p-4">
                    <div className="text-xs space-y-1">
                      <div className="text-indigo-700 font-semibold">{p.collaboration?.university.organization || p.collaboration?.university.name}</div>
                      <div className="text-teal-700 font-semibold">{p.collaboration?.industry.organization || p.collaboration?.industry.name}</div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-bold text-slate-700">{p.projectOutcome?.citizensBenefited || 0}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-bold text-slate-700">{p.projectOutcome?.patentsGenerated || 0} / {p.projectOutcome?.startupsCreated || 0}</span>
                  </td>
                </tr>
              ))}
              {resolvedProjects.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">
                    No verified projects with reported outcomes yet.
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

function CheckCircle2Icon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}
function Building2Icon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
}

function ImpactCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  const bgClass = color === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-semibold text-slate-500 leading-tight pr-4">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgClass}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
