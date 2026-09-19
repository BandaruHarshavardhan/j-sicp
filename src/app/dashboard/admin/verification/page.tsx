import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { CheckSquare, ShieldCheck, FileText, CheckCircle2 } from "lucide-react"
import { VerifyForm } from "@/components/admin/VerifyForm"

export default async function AdminVerificationPage() {
  const pendingVerification = await prisma.solutionProposal.findMany({
    where: { 
      status: "VERIFICATION"
    },
    include: {
      challenge: true,
      collaboration: {
        include: {
          university: { select: { name: true, organization: true } },
          industry: { select: { name: true, organization: true } }
        }
      },
      progressUpdates: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    }
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Verification</h1>
          <p className="text-slate-500 text-sm mt-1">Review and verify completed implementations.</p>
        </div>
      </div>

      {pendingVerification.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center">
          <ShieldCheck size={48} className="text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900">All caught up!</h2>
          <p className="text-slate-500 max-w-sm mt-2">There are currently no solutions waiting for government verification.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingVerification.map(sol => (
            <div key={sol.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      Ready for Verification
                    </span>
                    <span className="text-xs text-slate-500">Submitted {new Date(sol.progressUpdates[0]?.createdAt || sol.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{sol.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">Resolving: <Link href={`/challenge/${sol.challengeId}`} className="text-primary hover:underline">{sol.challenge.title}</Link></p>
                </div>
                
                <div className="shrink-0 flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">University</div>
                    <div className="font-bold text-slate-800 text-sm">{sol.collaboration?.university.organization || sol.collaboration?.university.name}</div>
                  </div>
                  <div className="text-slate-300">|</div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Industry</div>
                    <div className="font-bold text-slate-800 text-sm">{sol.collaboration?.industry.organization || sol.collaboration?.industry.name}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckSquare size={18} className="text-primary"/> Final Progress Updates
                  </h4>
                  <div className="space-y-4">
                    {sol.progressUpdates.map((update, idx) => (
                      <div key={update.id} className={`p-4 rounded-xl text-sm ${idx === 0 ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-900">{update.percentage}% - {update.milestone}</span>
                          <span className="text-xs text-slate-500">{new Date(update.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700">{update.description}</p>
                        {update.evidenceUrl && (
                          <a href={update.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-3 hover:underline">
                            <FileText size={14}/> View Attached Evidence
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-primary"/> Verification Actions
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-4">
                        Please review the final evidence provided by the university and industry partner. If the solution successfully addresses the challenge, you can mark it as resolved.
                      </p>
                      
                      <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
                        <div className="text-xs font-semibold text-slate-500 mb-1">Claimed Outcome</div>
                        <div className="text-sm font-medium text-slate-900">{sol.expectedOutcome}</div>
                      </div>
                    </div>
                    
                    <VerifyForm challengeId={sol.challengeId} solutionId={sol.id} collaborationId={sol.collaboration?.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
