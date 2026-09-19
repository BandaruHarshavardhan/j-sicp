import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { challengeId, solutionId, collaborationId, action } = await req.json()

    if (!challengeId || !solutionId || !action) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      if (action === 'verify') {
        await tx.challenge.update({
          where: { id: challengeId },
          data: { status: "RESOLVED" }
        })
        await tx.solutionProposal.update({
          where: { id: solutionId },
          data: { status: "RESOLVED" }
        })
        if (collaborationId) {
          await tx.collaboration.update({
            where: { id: collaborationId },
            data: { status: "COMPLETED" }
          })
          await tx.collaborationActivity.create({
            data: {
              collaborationId: collaborationId,
              actorId: session.user.id,
              actionType: "VERIFIED",
              description: "Government Monitor verified the outcome and marked the challenge as RESOLVED."
            }
          })
        }
      } else if (action === 'reject') {
        // Send back to IN_PROGRESS
        await tx.solutionProposal.update({
          where: { id: solutionId },
          data: { status: "IN_PROGRESS" }
        })
        if (collaborationId) {
          await tx.collaboration.update({
            where: { id: collaborationId },
            data: { status: "IN_PROGRESS" }
          })
          await tx.collaborationActivity.create({
            data: {
              collaborationId: collaborationId,
              actorId: session.user.id,
              actionType: "REJECTED_VERIFICATION",
              description: "Government Monitor requested more information or rework before resolving."
            }
          })
        }
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error verifying:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
