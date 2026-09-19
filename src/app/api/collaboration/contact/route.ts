import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { collaborationId, contactName, officialEmail, phone, department } = await req.json()

    if (!collaborationId || !contactName || !officialEmail) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const collaboration = await prisma.collaboration.findUnique({
      where: { id: collaborationId }
    })

    if (!collaboration) {
      return NextResponse.json({ message: "Collaboration not found" }, { status: 404 })
    }

    const isAuthorized = 
      session.user.id === collaboration.universityId || 
      session.user.id === collaboration.industryId || 
      session.user.role === 'ADMIN'

    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized access to this collaboration" }, { status: 403 })
    }

    // Upsert contact info for this user
    const contact = await prisma.collaborationContact.upsert({
      where: {
        collaborationId_userId: {
          collaborationId,
          userId: session.user.id
        }
      },
      update: {
        contactName,
        officialEmail,
        phone: phone || null,
        department: department || null
      },
      create: {
        collaborationId,
        userId: session.user.id,
        contactName,
        officialEmail,
        phone: phone || null,
        department: department || null
      }
    })

    return NextResponse.json(contact, { status: 200 })
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
