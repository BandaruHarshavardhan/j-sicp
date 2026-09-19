import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { CollaborationDashboard } from "@/components/collaboration/CollaborationDashboard"
import { BackButton } from "@/components/BackButton"

export default async function CollaborationPage({ params }: { params: Promise<{ collaborationId: string }> }) {
  const session = await auth()
  if (!session) {
    redirect("/auth/login")
  }
  
  const { collaborationId } = await params
  
  const collaboration = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: {
      challenge: true,
      solution: {
        include: {
          industrySupport: true,
          progressUpdates: {
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, organization: true } } }
          },
          aiProgressSummary: true,
          aiImplementationPlan: true
        }
      },
      university: { select: { id: true, name: true, organization: true, email: true } },
      industry: { select: { id: true, name: true, organization: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true, organization: true, role: true } }
        }
      },
      contacts: true,
      activities: {
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { name: true, organization: true } }
        }
      }
    }
  })

  if (!collaboration) {
    notFound()
  }

  // Security check: Only university, industry, or ADMIN can access
  const isUniversity = session.user.id === collaboration.universityId
  const isIndustry = session.user.id === collaboration.industryId
  const isAdmin = session.user.role === 'ADMIN'

  if (!isUniversity && !isIndustry && !isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-500">You are not a participant in this collaboration.</p>
          </div>
        </div>
      </div>
    )
  }

  const userRole = isUniversity ? 'UNIVERSITY' : isIndustry ? 'INDUSTRY' : 'ADMIN'

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton fallback={`/challenge/${collaboration.challengeId}/solution/${collaboration.solutionId}`} />
        <CollaborationDashboard 
          collaboration={collaboration} 
          currentUser={{ id: session.user.id, role: userRole }} 
        />
      </main>
    </div>
  )
}
