import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { detectDuplicateProblems } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json()

    if (!title || !description) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Get recently active problems to compare against
    const existingProblems = await prisma.challenge.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true, location: true, category: true, status: true }
    })

    const aiResult = await detectDuplicateProblems({ title, description }, existingProblems)

    // Map the returned IDs to the actual full objects
    let enrichedDuplicates = []
    if (aiResult.duplicates && Array.isArray(aiResult.duplicates)) {
      enrichedDuplicates = aiResult.duplicates.map((d: any) => {
        const fullProblem = existingProblems.find(p => p.id === d.id)
        if (fullProblem) {
          return {
            ...fullProblem,
            similarityPercentage: d.similarityPercentage,
            reason: d.reason
          }
        }
        return null
      }).filter(Boolean)
    }

    return NextResponse.json({ duplicates: enrichedDuplicates }, { status: 200 })
  } catch (error) {
    console.error("Error checking duplicates:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}
