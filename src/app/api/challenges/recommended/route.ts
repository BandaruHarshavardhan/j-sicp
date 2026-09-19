import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "INSTITUTION") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !user.profileTags) {
      // Return latest if no profile tags
      const challenges = await prisma.challenge.findMany({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED'] } },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(challenges)
    }

    // Get a bunch of open challenges
    const openChallenges = await prisma.challenge.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED'] } },
      take: 20,
      orderBy: { createdAt: 'desc' }
    })

    if (openChallenges.length === 0) return NextResponse.json([])

    // Use AI to rank them based on tags
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json(openChallenges.slice(0, 5))

    const ai = new GoogleGenAI({ apiKey })
    
    const challengesContext = openChallenges.map(c => `ID: ${c.id} | Category: ${c.category} | Title: ${c.title} | Desc: ${c.description.substring(0, 100)}`).join('\n')

    const aiPrompt = `
      You are an AI that matches societal challenges to university research labs and departments.
      
      University Profile Tags: ${user.profileTags}

      Available Challenges:
      ${challengesContext}

      Rank the top 3-5 challenges that best match the university's profile.
      Return a JSON array:
      [
        {
          "id": "ID of the challenge",
          "matchPercentage": 95,
          "reason": "Short reason why this matches their expertise."
        }
      ]
      Return ONLY valid JSON.
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: aiPrompt,
      config: { responseMimeType: "application/json" }
    })
    
    const matches = JSON.parse(response.text || "[]")
    
    // Join with real objects
    const recommended = matches.map((m: any) => {
      const challenge = openChallenges.find(c => c.id === m.id)
      if (challenge) {
        return {
          ...challenge,
          matchPercentage: m.matchPercentage,
          matchReason: m.reason
        }
      }
      return null
    }).filter(Boolean)

    return NextResponse.json(recommended)

  } catch (error) {
    console.error("Error fetching recommended challenges:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}
