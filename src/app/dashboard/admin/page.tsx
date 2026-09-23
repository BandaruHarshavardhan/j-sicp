import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { 
  FileText, 
  Search, 
  Users, 
  CheckCircle2, 
  Building2, 
  Handshake, 
  Activity, 
  AlertTriangle,
  Bot
} from "lucide-react"
import Link from "next/link"

export default async function AdminDashboardOverview() {
  const t0 = performance.now();
  
  // Measure auth
  const tAuthStart = performance.now();
  const session = await auth();
  const tAuthEnd = performance.now();

  const tDbStart = performance.now();
  
  const [
    q1Res,
    q2Res,
    q3Res,
    q4Res,
    q5Res,
    q6Res
  ] = await Promise.all([
    (async () => { const s = performance.now(); const r = await prisma.solutionProposal.count({ where: { status: "PROPOSED" } }); return {r, t: performance.now() - s}; })(),
    (async () => { const s = performance.now(); const r = await prisma.industrySupport.count(); return {r, t: performance.now() - s}; })(),
    (async () => { const s = performance.now(); const r = await prisma.challenge.groupBy({ by: ['category'], _count: true }); return {r, t: performance.now() - s}; })(),
    (async () => { const s = performance.now(); const r = await prisma.challenge.groupBy({ by: ['status'], _count: true }); return {r, t: performance.now() - s}; })(),
    (async () => { const s = performance.now(); const r = await prisma.challenge.findMany({ select: { district: true, location: true } }); return {r, t: performance.now() - s}; })(),
    (async () => { const s = performance.now(); const r = await prisma.collaboration.groupBy({ by: ['status'], _count: true }); return {r, t: performance.now() - s}; })()
  ]);

  const proposedCount = q1Res.r;
  const supportedCount = q2Res.r;
  const challengesByDomainRaw = q3Res.r;
  const challengesByStatusRaw = q4Res.r;
  const allChallenges = q5Res.r;
  const collaborationsByStatusRaw = q6Res.r;

  const tDbEnd = performance.now();

  const getChallengeStatusCount = (status: string) => 
    challengesByStatusRaw.find(c => c.status === status)?._count || 0;

  const getCollabStatusCount = (status: string) => 
    collaborationsByStatusRaw.find(c => c.status === status)?._count || 0;

  const challengesCount = challengesByStatusRaw.reduce((sum, item) => sum + item._count, 0);
  const underReviewCount = getChallengeStatusCount("UNDER_REVIEW");
  const assignedCount = getChallengeStatusCount("ASSIGNED");
  const resolvedCount = getChallengeStatusCount("RESOLVED");
  
  const activeCollaborationsCount = collaborationsByStatusRaw.reduce((sum, item) => sum + item._count, 0);
  const inProgressCount = getCollabStatusCount("IN_PROGRESS");
  // Domain analytics
  const challengesByDomain = challengesByDomainRaw.map(d => ({
    name: d.category || 'Uncategorized',
    count: d._count
  })).sort((a, b) => b.count - a.count).slice(0, 5)

  // Status analytics

  // District analytics
  // To handle challenges that have GPS (district) vs those that only have manual location
  
  const districtCounts: Record<string, number> = {}
  for (const c of allChallenges) {
    const d = c.district || c.location.split(',')[0].trim() || 'Unknown District'
    districtCounts[d] = (districtCounts[d] || 0) + 1
  }

  const tRenderStart = performance.now();
  
  const timings = {
    totalRequestSoFar: performance.now() - t0,
    authDuration: tAuthEnd - tAuthStart,
    q1_proposed: q1Res.t,
    q2_supported: q2Res.t,
    q3_groupCat: q3Res.t,
    q4_groupStatus: q4Res.t,
    q5_findMany: q5Res.t,
    q6_collabStatus: q6Res.t,
    totalDb: tDbEnd - tDbStart,
    aiApi: 0,
    renderStart: tRenderStart
  };
  
  const challengesByDistrict = Object.entries(districtCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Government Monitoring Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor societal challenges, institutional participation, industry collaboration, project progress and community impact.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Challenges" value={challengesCount} icon={FileText} color="blue" />
        <StatCard title="Under Review" value={underReviewCount} icon={Search} color="slate" />
        <StatCard title="Assigned to Universities" value={assignedCount} icon={Users} color="purple" />
        <StatCard title="Solutions Proposed" value={proposedCount} icon={CheckCircle2} color="indigo" />
        <StatCard title="Industry Supported" value={supportedCount} icon={Building2} color="emerald" />
        <StatCard title="In Implementation" value={inProgressCount} icon={Activity} color="amber" />
        <StatCard title="Resolved" value={resolvedCount} icon={CheckCircle2} color="green" />
        <StatCard title="Active Collaborations" value={activeCollaborationsCount} icon={Handshake} color="cyan" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Challenges by Domain</h2>
            <div className="space-y-4">
              {challengesByDomain.map((domain) => (
                <div key={domain.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{domain.name}</span>
                    <span className="font-bold text-slate-900">{domain.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${Math.max(10, (domain.count / Math.max(1, challengesCount)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {challengesByDomain.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No data available yet.</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6">District-wise Challenge Distribution</h2>
            <div className="space-y-4">
              {challengesByDistrict.map((district) => (
                <div key={district.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{district.name}</span>
                    <span className="font-bold text-slate-900">{district.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-teal-500 h-2 rounded-full" 
                      style={{ width: `${Math.max(10, (district.count / Math.max(1, challengesCount)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {challengesByDistrict.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No data available yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
            <div className="flex items-center gap-2 mb-6">
              <Bot className="text-indigo-600" size={24} />
              <h2 className="text-lg font-bold text-indigo-900">AI Government Insights</h2>
            </div>
            
            <div className="space-y-5">
              <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1">Challenge Trend</h3>
                <p className="text-sm text-indigo-900">
                  {challengesByDomain[0] ? `${challengesByDomain[0].name}-related challenges are currently the most reported issue area in the platform.` : 'Insufficient data to determine trends.'}
                </p>
              </div>
              
              <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1">Implementation Insight</h3>
                <p className="text-sm text-indigo-900">
                  {inProgressCount > 0 ? `There are ${inProgressCount} projects currently in active implementation across various districts.` : 'No active implementations currently.'}
                </p>
              </div>
              
              <div className="bg-white/60 p-4 rounded-xl border border-amber-100/50 border-l-4 border-l-amber-500">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1">
                  <AlertTriangle size={14} /> Attention
                </h3>
                <p className="text-sm text-amber-900">
                  You have {underReviewCount} new challenges awaiting review and assignment.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div id="diagnostics-timing" style={{display: 'none'}} data-timings={JSON.stringify(timings)}></div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    cyan: "bg-cyan-50 text-cyan-600",
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <p className="text-sm font-semibold text-slate-500 leading-tight pr-4">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
