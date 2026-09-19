import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { AlertCircle, Target, CheckCircle2, Clock, MapPin } from "lucide-react"
import { RecommendedChallenges } from "@/components/RecommendedChallenges"

export default async function OrganizationDashboard() {
  const session = await auth()

  if (!session || !session.user || session.user.role !== 'INSTITUTION') {
    redirect("/auth/login")
  }

  // Get solutions proposed by this organization
  const solutions = await prisma.solutionProposal.findMany({
    where: { organizationId: session.user.id },
    include: {
      challenge: {
        include: { aiAnalysis: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {session.user.organization || session.user.name}</h1>
            <p className="text-slate-500 mt-1">Manage your active projects and proposals.</p>
          </div>
          <Link href="/explore" className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 transition">
            <Target size={16} className="mr-2" /> Find New Challenges
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Proposals</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{solutions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Industry Accepted</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {solutions.filter(s => s.status === 'INDUSTRY_ACCEPTED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <RecommendedChallenges />

        <h2 className="text-xl font-bold text-slate-900 mb-4">Your Solutions</h2>
        
        {solutions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Target className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No proposals yet</h3>
            <p className="text-slate-500 mt-1 mb-6">Explore challenges and propose your first solution.</p>
            <Link href="/explore" className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 transition">
              Explore Challenges
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {solutions.map(solution => (
              <div key={solution.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{solution.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">For: {solution.challenge.title}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    solution.status === 'INDUSTRY_ACCEPTED' ? 'bg-green-100 text-green-700' :
                    solution.status === 'PROPOSED' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {solution.status}
                  </span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <MapPin size={16} className="text-slate-400 shrink-0" />
                    <span className="truncate">{solution.challenge.location}</span>
                  </div>
                  
                  <div className="mt-auto pt-4 flex gap-3">
                    <Link href={`/challenge/${solution.challengeId}`} className="flex-1 text-center py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                      View Challenge
                    </Link>
                    {solution.status === 'INDUSTRY_ACCEPTED' && (
                      <Link href={`/challenge/${solution.challengeId}/solution/${solution.id}`} className="flex-1 text-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition">
                        Implementation Tracking
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
