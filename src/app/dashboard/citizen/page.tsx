import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { AlertCircle, Plus, FileText, CheckCircle2, Clock } from "lucide-react"

export default async function CitizenDashboard() {
  const session = await auth()

  if (!session || !session.user || session.user.role !== "CITIZEN") {
    redirect("/auth/login")
  }

  const challenges = await prisma.challenge.findMany({
    where: { reporterId: session.user.id },
    include: {
      aiAnalysis: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SUBMITTED': return 'bg-slate-100 text-slate-700'
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-700'
      case 'ASSIGNED': return 'bg-purple-100 text-purple-700'
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700'
      case 'RESOLVED': return 'bg-green-100 text-green-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {session.user.name}</h1>
            <p className="text-slate-500 mt-1">Manage the societal challenges you've reported.</p>
          </div>
          <Link href="/report" className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 transition">
            <Plus size={16} className="mr-2" /> Report a Problem
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Reported</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{challenges.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <FileText size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Resolved</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {challenges.filter(c => c.status === 'RESOLVED').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">In Progress</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {challenges.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-4">Your Reports</h2>
        
        {challenges.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No reports yet</h3>
            <p className="text-slate-500 mt-1">You haven't reported any problems in your community yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {challenges.map(challenge => (
                <li key={challenge.id}>
                  <Link href={`/challenge/${challenge.id}`} className="block hover:bg-slate-50 transition p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(challenge.status)}`}>
                            {challenge.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {new Date(challenge.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-slate-900 truncate max-w-xl">{challenge.title}</p>
                        <p className="text-sm text-slate-500 truncate max-w-2xl mt-1">
                          {challenge.aiAnalysis?.problemBrief || challenge.description}
                        </p>
                      </div>
                      <div className="hidden md:flex flex-col items-end">
                        <p className="text-sm font-medium text-slate-900">{challenge.category}</p>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                          View details &rarr;
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
