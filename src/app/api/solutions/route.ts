import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { analyzeSolutionProposal, matchIndustryToSolution } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user || session.user.role !== 'INSTITUTION') {
      return NextResponse.json({ message: "Unauthorized. Only institutions can propose solutions." }, { status: 403 })
    }

    const { challengeId, title, description, resources, timeline, estimatedCost, documentUrl, pptUrl } = await req.json()

    if (!challengeId || !title || !description || !resources || !timeline) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }
    
    if (!documentUrl) {
      return NextResponse.json({ message: "PDF Document is mandatory" }, { status: 400 })
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 })
    }

    // Run AI Analysis
    const aiAnalysis = await analyzeSolutionProposal(challenge.title, challenge.description, title, description, resources)
    
    const industries = await prisma.user.findMany({ where: { role: 'INDUSTRY' } })
    const industryMatches = await matchIndustryToSolution(title, description, industries)

    const solution = await prisma.$transaction(async (tx) => {
      // Create the solution proposal
      const newSolution = await tx.solutionProposal.create({
        data: {
          challengeId,
          organizationId: session.user.id,
          title,
          description,
          resources,
          timeline,
          estimatedCost,
          documentUrl,
          pptUrl,
          status: "PROPOSED",
          expectedOutcome: "TBD"
        }
      })

      // Update challenge status to SOLUTION_PROPOSED
      await tx.challenge.update({
        where: { id: challengeId },
        data: { status: "SOLUTION_PROPOSED" }
      })

      // Save AI Insights
      await tx.aISolutionAnalysis.create({
        data: {
          solutionId: newSolution.id,
          problemAlignment: aiAnalysis.problemAlignment || "Unknown",
          expectedImpact: aiAnalysis.expectedImpact || "Unknown",
          feasibility: aiAnalysis.feasibility || "Unknown",
          requiredResources: resources,
          implementationRisks: aiAnalysis.implementationRisks || "Unknown",
          suggestedImprovements: aiAnalysis.suggestedImprovements || "Unknown",
          suggestedIndustries: JSON.stringify(industryMatches.matches || [])
        }
      })

      return newSolution
    })

    return NextResponse.json({ message: "Solution proposed successfully", solutionId: solution.id }, { status: 201 })
  } catch (error) {
    console.error("Error creating solution proposal:", error)
    return NextResponse.json({ message: "An error occurred while proposing the solution" }, { status: 500 })
  }
}
