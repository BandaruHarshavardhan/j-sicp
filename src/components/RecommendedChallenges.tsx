"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bot, MapPin, ArrowRight } from "lucide-react"

export function RecommendedChallenges() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/challenges/recommended")
      .then(res => res.json())
      .then(data => {
        setChallenges(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex items-center justify-center h-48">
        <div className="animate-pulse flex flex-col items-center">
          <Bot className="text-indigo-400 mb-2" size={32} />
          <p className="text-indigo-600 font-medium">AI is finding the best matches for your institution...</p>
        </div>
      </div>
    )
  }

  if (challenges.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-8 relative overflow-hidden">
      <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
        <Bot size={150} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <Bot className="text-indigo-600" size={24} />
          <h2 className="text-xl font-bold text-indigo-950">AI Recommended Challenges</h2>
          <span className="text-xs font-medium bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded ml-2">Based on your profile tags</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {challenges.map((challenge, i) => (
            <div key={challenge.id || i} className="bg-white/80 backdrop-blur border border-indigo-100 p-4 rounded-xl hover:shadow-md transition group flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 line-clamp-1">{challenge.title}</h3>
                {challenge.matchPercentage && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded shrink-0 ml-2">
                    {challenge.matchPercentage}% Match
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                <MapPin size={12} /> {challenge.location}
              </div>

              {challenge.matchReason && (
                <p className="text-sm text-indigo-800 bg-indigo-50/50 p-2 rounded mb-4 flex-1">
                  {challenge.matchReason}
                </p>
              )}

              <Link href={`/challenge/${challenge.id}`} className="mt-auto inline-flex items-center text-sm font-bold text-indigo-600 group-hover:text-indigo-700">
                View Challenge <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
