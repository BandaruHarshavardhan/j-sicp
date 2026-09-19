import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseNaturalLanguageSearch } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    if (!query) {
      return NextResponse.json({ message: "No query provided" }, { status: 400 })
    }

    const aiFilters = await parseNaturalLanguageSearch(query)

    let whereClause: any = {}
    
    if (aiFilters.category && aiFilters.category !== "null") {
      whereClause.category = { contains: aiFilters.category }
    }
    if (aiFilters.location && aiFilters.location !== "null") {
      whereClause.location = { contains: aiFilters.location }
    }
    if (aiFilters.status && aiFilters.status !== "null") {
      whereClause.status = aiFilters.status
    }

    if (aiFilters.keywords && aiFilters.keywords !== "null" && aiFilters.keywords.trim() !== "") {
      whereClause.OR = [
        { title: { contains: aiFilters.keywords } },
        { description: { contains: aiFilters.keywords } }
      ]
    }

    const results = await prisma.challenge.findMany({
      where: whereClause,
      include: {
        aiAnalysis: true,
        reporter: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      filtersApplied: aiFilters,
      results
    })

  } catch (error) {
    console.error("Error performing AI search:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}
