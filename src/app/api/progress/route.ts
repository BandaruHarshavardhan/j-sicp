import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { summarizeProgress } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    console.log("POST /api/progress - Session user:", session.user);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.user.id as string },
          { email: session.user.email as string }
        ]
      }
    })
    
    if (!user) {
      console.log("POST /api/progress - User not found for id/email:", session.user.id, session.user.email);
      return NextResponse.json({ message: "User not found. Please log in again." }, { status: 404 })
    }

    const { solutionId, title, description, percentage, milestone, status, nextSteps, issuesRisks, evidenceUrl } = await req.json()
    console.log("POST /api/progress - Payload:", { solutionId, title, description, percentage });

    if (!solutionId || !description || percentage === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const solution = await prisma.solutionProposal.findUnique({
      where: { id: solutionId },
      include: { progressUpdates: true, industrySupport: true }
    })

    if (!solution) {
      console.log("POST /api/progress - Solution not found for id:", solutionId);
      return NextResponse.json({ message: "Solution not found" }, { status: 404 })
    }

    // Role check
    const isOwner = user.id === solution.organizationId || (solution.industrySupport && user.id === solution.industrySupport.industryId)
    const isAdmin = user.role === 'ADMIN'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Unauthorized. You cannot post updates for this solution." }, { status: 403 })
    }

    // Combine previous updates with the new one for AI
    const allUpdates = solution.progressUpdates.map(u => u.description).concat(description)

    // Generate new AI summary
    const aiSummary = await summarizeProgress(solution.title, allUpdates)

    const update = await prisma.$transaction(async (tx) => {
      const newUpdate = await tx.progressUpdate.create({
        data: {
          solutionId,
          userId: user.id,
          userRole: user.role,
          title: title || null,
          description,
          percentage: parseInt(percentage.toString(), 10),
          milestone: milestone || null,
          status: status || null,
          nextSteps: nextSteps || null,
          issuesRisks: issuesRisks || null,
          evidenceUrl: evidenceUrl || null
        }
      })

      // Get Collaboration
      const collaboration = await tx.collaboration.findUnique({
        where: { solutionId }
      })

      if (collaboration) {
        let newStatus = collaboration.status
        if (newUpdate.percentage === 100) {
          newStatus = "VERIFICATION"
        } else if (newUpdate.percentage > 0 && newStatus === "ACTIVE") {
          newStatus = "IN_PROGRESS"
        }

        if (newStatus !== collaboration.status) {
          await tx.collaboration.update({
            where: { id: collaboration.id },
            data: { status: newStatus }
          })
          
          await tx.collaborationActivity.create({
            data: {
              collaborationId: collaboration.id,
              actorId: user.id,
              actionType: "STATUS_CHANGED",
              description: `Status changed to ${newStatus.replace('_', ' ')}`
            }
          })
        }

        await tx.collaborationActivity.create({
          data: {
            collaborationId: collaboration.id,
            actorId: user.id,
            actionType: "PROGRESS_UPDATE",
            description: `${user.organization || user.name} posted a progress update (${newUpdate.percentage}%).`
          }
        })
      }

      // Update or create summary
      const existingSummary = await tx.aIProgressSummary.findUnique({ where: { solutionId } })
      
      if (existingSummary) {
        await tx.aIProgressSummary.update({
          where: { solutionId },
          data: {
            summary: aiSummary.summary || "Summary unavailable",
            completedMilestones: JSON.stringify(aiSummary.completedMilestones || []),
            pendingMilestones: JSON.stringify(aiSummary.pendingMilestones || []),
            risks: JSON.stringify(aiSummary.risks || []),
            nextAction: aiSummary.nextAction || "Unknown"
          }
        })
      } else {
        await tx.aIProgressSummary.create({
          data: {
            solutionId,
            summary: aiSummary.summary || "Summary unavailable",
            completedMilestones: JSON.stringify(aiSummary.completedMilestones || []),
            pendingMilestones: JSON.stringify(aiSummary.pendingMilestones || []),
            risks: JSON.stringify(aiSummary.risks || []),
            nextAction: aiSummary.nextAction || "Unknown"
          }
        })
      }

      if (percentage >= 100) {
        await tx.solutionProposal.update({
          where: { id: solutionId },
          data: { status: "VERIFICATION" }
        })
        await tx.challenge.update({
          where: { id: solution.challengeId },
          data: { status: "VERIFICATION" }
        })
      } else {
        await tx.solutionProposal.update({
          where: { id: solutionId },
          data: { status: "IN_PROGRESS" }
        })
        await tx.challenge.update({
          where: { id: solution.challengeId },
          data: { status: "IN_PROGRESS" }
        })
      }

      return newUpdate
    })

    return NextResponse.json({ message: "Progress updated", updateId: update.id }, { status: 201 })
  } catch (error) {
    console.error("Error creating progress update:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}
