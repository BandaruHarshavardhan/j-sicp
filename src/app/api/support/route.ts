import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateImplementationPlan } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user || session.user.role !== 'INDUSTRY') {
      return NextResponse.json({ message: "Unauthorized. Only industries can accept and support solutions." }, { status: 403 })
    }

    const data = await req.json()
    const { 
      solutionId, 
      contactPerson, 
      supportType, 
      resources, 
      technology, 
      funding, 
      personnelCount, 
      contribution, 
      startDate, 
      completionDate, 
      remarks, 
      documentUrl 
    } = data

    if (!solutionId || !contactPerson || !supportType || !resources || !contribution || !startDate || !completionDate) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Check if solution exists and is not already supported
    const solution = await prisma.solutionProposal.findUnique({
      where: { id: solutionId }
    })

    if (!solution) {
      return NextResponse.json({ message: "Solution not found" }, { status: 404 })
    }

    if (solution.status === 'INDUSTRY_ACCEPTED' || solution.status === 'IN_PROGRESS' || solution.status === 'RESOLVED') {
      return NextResponse.json({ message: "Solution has already been accepted" }, { status: 400 })
    }

    const aiRoadmap = await generateImplementationPlan(solution.title, supportType)

    const industrySupport = await prisma.$transaction(async (tx) => {
      // Create the industry support record
      const support = await tx.industrySupport.create({
        data: {
          solutionId,
          industryId: session.user.id,
          contactPerson,
          supportType,
          resources,
          technology,
          funding,
          personnelCount,
          contribution,
          startDate,
          completionDate,
          remarks,
          documentUrl
        }
      })

      // Update solution status
      await tx.solutionProposal.update({
        where: { id: solutionId },
        data: { status: "INDUSTRY_ACCEPTED" }
      })

      // Update challenge status
      await tx.challenge.update({
        where: { id: solution.challengeId },
        data: { status: "INDUSTRY_ACCEPTED" }
      })

      // Create an initial progress update to track this acceptance
      await tx.progressUpdate.create({
        data: {
          solutionId,
          description: `Industry partner ${(session.user as any)?.organization || session.user.name} has officially accepted and will support this solution.`,
          percentage: 5
        }
      })

      // Save AI Implementation Plan
      await tx.aIImplementationPlan.create({
        data: {
          solutionId,
          roadmap: JSON.stringify(aiRoadmap.phases || [])
        }
      })

      // Create Collaboration
      const collaboration = await tx.collaboration.create({
        data: {
          challengeId: solution.challengeId,
          solutionId: solution.id,
          universityId: solution.organizationId,
          industryId: session.user.id,
          status: "ACTIVE"
        }
      })

      // Create initial Collaboration Activity
      await tx.collaborationActivity.create({
        data: {
          collaborationId: collaboration.id,
          actorId: session.user.id,
          actionType: "SUPPORT_ACCEPTED",
          description: `Industry partner ${(session.user as any)?.organization || session.user.name} accepted the solution and created the collaboration.`
        }
      })

      return support
    })

    return NextResponse.json({ message: "Industry support successfully committed", supportId: industrySupport.id }, { status: 201 })
  } catch (error) {
    console.error("Error creating industry support:", error)
    return NextResponse.json({ message: "An error occurred while committing support" }, { status: 500 })
  }
}
