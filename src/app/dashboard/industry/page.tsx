import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { Target, CheckCircle2, Clock, MapPin, Briefcase } from "lucide-react"

export default async function IndustryDashboard() {
  const session = await auth()

  if (!session || !session.user || session.user.role !== 'INDUSTRY') {
    redirect("/auth/login")
  }

  // Get industry supports provided by this industry
  const industrySupports = await prisma.industrySupport.findMany({
    where: { industryId: session.user.id },
    include: {
      solution: {
        include: {
          challenge: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get some solutions awaiting support
  const solutionsAwaitingSupport = await prisma.solutionProposal.findMany({
    where: { status: 'PROPOSED' },
    include: {
      challenge: true
    },
    take: 4,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {session.user.organization || session.user.name}</h1>
            <p className="text-slate-500 mt-1">Manage your industry partnerships and support commitments.</p>
          </div>
          <Link href="/explore" className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 transition">
            <Target size={16} className="mr-2" /> Browse Challenges
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Supported Solutions</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{industrySupports.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {industrySupports.filter(s => s.solution.status === 'INDUSTRY_ACCEPTED' || s.solution.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Your Supported Solutions</h2>
              
              {industrySupports.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">No supported solutions yet</h3>
                  <p className="text-slate-500 mt-1 mb-6">Find university proposed solutions that align with your industry.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {industrySupports.map(support => (
                    <div key={support.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-green-100 text-green-700">
                            {support.solution.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{support.solution.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-3 line-clamp-2">For Challenge: {support.solution.challenge.title}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Your Support:</span>
                            <p className="font-medium text-slate-900">{support.supportType}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Timeline:</span>
                            <p className="font-medium text-slate-900">{new Date(support.startDate).toLocaleDateString()} - {new Date(support.completionDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                        <Link href={`/challenge/${support.solution.challengeId}/solution/${support.solutionId}`} className="text-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition">
                          Track Progress
                        </Link>
                        <Link href={`/challenge/${support.solution.challengeId}`} className="text-center py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Solutions Awaiting Support</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {solutionsAwaitingSupport.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-slate-500 text-sm">No solutions currently looking for support.</p>
                  </div>
                ) : (
                  solutionsAwaitingSupport.map(solution => (
                    <div key={solution.id} className="p-5 hover:bg-slate-50 transition">
                      <h3 className="font-semibold text-slate-900 text-sm mb-1">{solution.title}</h3>
                      <p className="text-xs text-slate-500 mb-3 line-clamp-1">{solution.challenge.title}</p>
                      <Link href={`/challenge/${solution.challengeId}`} className="text-xs font-medium text-secondary hover:text-secondary/80 flex items-center gap-1">
                        Review & Support <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
