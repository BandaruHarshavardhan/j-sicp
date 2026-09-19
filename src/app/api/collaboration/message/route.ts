import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { collaborationId, message } = await req.json()

    if (!collaborationId || !message) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 })
    }

    const collaboration = await prisma.collaboration.findUnique({
      where: { id: collaborationId }
    })

    if (!collaboration) {
      return NextResponse.json({ message: "Collaboration not found" }, { status: 404 })
    }

    // Check authorization: must be the university or industry of this collaboration (or admin)
    const isAuthorized = 
      session.user.id === collaboration.universityId || 
      session.user.id === collaboration.industryId || 
      session.user.role === 'ADMIN'

    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized access to this collaboration" }, { status: 403 })
    }

    const newMessage = await prisma.collaborationMessage.create({
      data: {
        collaborationId,
        senderId: session.user.id,
        message
      },
      include: {
        sender: {
          select: { name: true, organization: true, role: true }
        }
      }
    })

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
