import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { categorizeAndAnalyzeProblem } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user || session.user.role !== "CITIZEN") {
      return NextResponse.json({ message: "Unauthorized. Only citizens can report challenges." }, { status: 403 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email as string } })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const { 
      title, description, location, 
      address, locality, city, district, state, pincode, 
      latitude, longitude, category, imageUrl, videoUrl 
    } = await req.json()

    if (!title || !description || !location) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const aiResult = await categorizeAndAnalyzeProblem(title, description, location, category)

    // Use a transaction to create the challenge and its AI analysis
    const challenge = await prisma.$transaction(async (tx) => {
      const newChallenge = await tx.challenge.create({
        data: {
          title,
          description,
          location,
          address: address || null,
          locality: locality || null,
          city: city || null,
          district: district || null,
          state: state || null,
          pincode: pincode || null,
          latitude: latitude || null,
          longitude: longitude || null,
          category: aiResult.category || category,
          imageUrl,
          videoUrl,
          reporterId: user.id,
          status: "UNDER_REVIEW"
        }
      })

      await tx.aIAnalysis.create({
        data: {
          challengeId: newChallenge.id,
          category: aiResult.category || category || "Uncategorized",
          subcategory: aiResult.subcategory || "Unknown",
          severity: aiResult.severity || "Medium",
          priority: aiResult.priority || "Medium",
          priorityReason: aiResult.priorityReason || null,
          problemBrief: aiResult.problemBrief || description.substring(0, 100),
          impact: aiResult.impact || "Unknown",
          suggestedStakeholders: JSON.stringify(aiResult.suggestedStakeholders || []),
          suggestedSolutions: JSON.stringify(aiResult.suggestedSolutions || [])
        }
      })

      return newChallenge
    })

    return NextResponse.json({ message: "Challenge created successfully", challengeId: challenge.id }, { status: 201 })
  } catch (error) {
    console.error("Error creating challenge:", error)
    return NextResponse.json({ message: "An error occurred while creating the challenge" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    
    let whereClause: any = {}
    if (status) whereClause.status = status
    if (category) whereClause.category = category

    const challenges = await prisma.challenge.findMany({
      where: whereClause,
      include: {
        aiAnalysis: true,
        reporter: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(challenges)
  } catch (error) {
    console.error("Error fetching challenges:", error)
    return NextResponse.json({ message: "An error occurred while fetching challenges" }, { status: 500 })
  }
}
