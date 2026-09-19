import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { MapPin, Clock, AlertCircle, Search, Filter } from "lucide-react"

import { parseNaturalLanguageSearch } from "@/lib/ai"

export default async function ExplorePage({
  searchParams
}: {
  searchParams: Promise<{ category?: string, status?: string, q?: string }>
}) {
  const { category, status, q } = await searchParams

  let whereClause: any = {}
  
  if (q) {
    // If AI NL search is used, parse the query
    const aiFilters = await parseNaturalLanguageSearch(q)
    
    whereClause.AND = []

    if (aiFilters.category && aiFilters.category !== "null") {
      whereClause.AND.push({ category: { contains: aiFilters.category } })
    }
    if (aiFilters.location && aiFilters.location !== "null") {
      whereClause.AND.push({
        OR: [
          { location: { contains: aiFilters.location } },
          { city: { contains: aiFilters.location } },
          { district: { contains: aiFilters.location } },
          { state: { contains: aiFilters.location } }
        ]
      })
    }
    if (aiFilters.status && aiFilters.status !== "null") {
      whereClause.AND.push({ status: aiFilters.status })
    }
    if (aiFilters.keywords && aiFilters.keywords !== "null" && aiFilters.keywords.trim() !== "") {
      whereClause.AND.push({
        OR: [
          { title: { contains: aiFilters.keywords } },
          { description: { contains: aiFilters.keywords } }
        ]
      })
    }

    if (whereClause.AND.length === 0) {
      delete whereClause.AND
    }
  } else {
    // Standard filters
    if (category) whereClause.category = category
    if (status) whereClause.status = status
  }

  const challenges = await prisma.challenge.findMany({
    where: whereClause,
    include: {
      aiAnalysis: true,
      reporter: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Group stats
  const total = challenges.length
  const critical = challenges.filter(c => c.aiAnalysis?.severity === 'Critical').length

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

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null
    let color = 'bg-slate-100 text-slate-700'
    if (severity === 'High') color = 'bg-orange-100 text-orange-700'
    if (severity === 'Critical') color = 'bg-red-100 text-red-700'
    if (severity === 'Medium') color = 'bg-yellow-100 text-yellow-700'
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>{severity}</span>
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Explore Challenges</h1>
            <p className="text-slate-500 mt-1">Discover societal problems waiting for innovative solutions.</p>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
              <span className="font-bold text-primary">{total}</span> Total
            </div>
            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
              <span className="font-bold text-red-600">{critical}</span> Critical
            </div>
          </div>
        </div>

        {/* Filters bar - minimal implementation for demo */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form action="/explore" method="GET" className="flex w-full md:flex-1 max-w-2xl relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              name="q"
              defaultValue={q || ""}
              placeholder="Ask AI: 'Show me critical water issues in Delhi'" 
              className="block w-full pl-10 pr-24 py-3 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-sm"
            />
            <button type="submit" className="absolute inset-y-1.5 right-1.5 px-3 py-1.5 bg-primary text-white rounded-md text-xs font-bold hover:bg-primary/90 transition">
              AI Search
            </button>
          </form>
          <div className="flex gap-2 w-full md:w-auto">
            <Link href="/explore" className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition whitespace-nowrap">
              Clear Filters
            </Link>
          </div>
        </div>

        {/* Grid */}
        {challenges.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No challenges found</h3>
            <p className="text-slate-500 mt-1">Be the first to report a problem in your community.</p>
            <Link href="/report" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90">
              Report a Problem
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map(challenge => (
              <Link href={`/challenge/${challenge.id}`} key={challenge.id} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                {/* Fallback pattern if no image */}
                <div className="h-40 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {challenge.imageUrl ? (
                    <img src={challenge.imageUrl} alt={challenge.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-primary/5 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {getSeverityBadge(challenge.aiAnalysis?.severity)}
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm ${getStatusColor(challenge.status)}`}>
                      {challenge.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs text-secondary font-semibold mb-2 uppercase tracking-wide">
                    {challenge.aiAnalysis?.category || challenge.category || "Uncategorized"}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1">
                    {challenge.aiAnalysis?.problemBrief || challenge.description}
                  </p>
                  
                  <div className="pt-4 border-t border-slate-100 mt-auto flex flex-col gap-2">
                    <div className="flex items-center text-xs text-slate-500 gap-1.5 line-clamp-1">
                      <MapPin size={14} className="text-slate-400 shrink-0" /> 
                      <span className="truncate">{challenge.location}</span>
                      {challenge.address && <span title="GPS Location Verified" className="shrink-0 text-emerald-500">📍</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" /> {new Date(challenge.createdAt).toLocaleDateString()}
                      </div>
                      <div className="font-medium text-slate-700">
                        By {challenge.reporter.name}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
