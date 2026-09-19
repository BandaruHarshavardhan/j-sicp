import Link from "next/link"
import { ArrowRight, BarChart3, Globe, Users, Shield, Lightbulb } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                From Local Problems to <span className="text-secondary">Real-World Solutions.</span>
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl">
                J-SICP connects citizens, institutions, industries and government to identify, understand and solve societal challenges faster with AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/report" 
                  className="px-8 py-4 bg-secondary hover:bg-accent text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  Report a Problem <ArrowRight size={20} />
                </Link>
                <Link 
                  href="/explore" 
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition flex items-center justify-center border border-white/20"
                >
                  Explore Challenges
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-square md:aspect-video rounded-2xl bg-gradient-to-br from-secondary/40 to-primary-foreground/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative">
                {/* Abstract Workflow Visualization */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10 flex flex-col gap-6 w-3/4">
                  <div className="bg-white text-primary p-4 rounded-xl shadow-lg transform -rotate-2 hover:rotate-0 transition duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><User size={16} /></div>
                      <div>
                        <div className="text-sm font-bold">Citizen Report</div>
                        <div className="text-xs text-slate-500">Water shortage in village...</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-secondary text-white p-4 rounded-xl shadow-lg transform translate-x-8 hover:translate-x-6 transition duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Globe size={16} /></div>
                      <div>
                        <div className="text-sm font-bold">AI Analysis</div>
                        <div className="text-xs text-white/80">Category: Water, Priority: High</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary-foreground text-primary p-4 rounded-xl shadow-lg transform rotate-2 translate-x-4 hover:rotate-0 transition duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><Users size={16} /></div>
                      <div>
                        <div className="text-sm font-bold">Industry Match</div>
                        <div className="text-xs text-slate-500">TCS proposes solar pump...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">How J-SICP Works</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">An AI-powered pipeline to turn community problems into actionable civic projects.</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-slate-200 z-0"></div>
              
              {[
                { step: "01", title: "Citizen Report", desc: "Citizens submit problems with location & media." },
                { step: "02", title: "AI Analysis", desc: "Gemini AI categorizes, summarizes, and tags stakeholders." },
                { step: "03", title: "Challenge Matching", desc: "Universities & Industries claim relevant challenges." },
                { step: "04", title: "Resolution", desc: "Solutions are implemented and verified by the community." }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white shadow-md border-4 border-slate-50 flex items-center justify-center text-secondary font-bold text-xl mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Stakeholders */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">Empowering Every Stakeholder</h2>
                  <p className="text-slate-600">
                    J-SICP brings together the four pillars of society to create meaningful change.
                  </p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition">
                    <User className="text-secondary mb-4 h-8 w-8" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">For Citizens</h3>
                    <p className="text-sm text-slate-600">A voice for your community. Report issues instantly and track real-time resolution progress.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition">
                    <Lightbulb className="text-secondary mb-4 h-8 w-8" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">For Institutions</h3>
                    <p className="text-sm text-slate-600">Real-world projects for students. Apply academic knowledge to solve actual societal problems.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition">
                    <Users className="text-secondary mb-4 h-8 w-8" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">For Industry</h3>
                    <p className="text-sm text-slate-600">Direct CSR impact. Find vetted challenges aligned with your corporate social responsibility goals.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition">
                    <Shield className="text-secondary mb-4 h-8 w-8" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">For Government</h3>
                    <p className="text-sm text-slate-600">Macro-level insights. Monitor challenges, track progress, and allocate resources efficiently.</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <Globe size={200} />
                </div>
                <div className="relative z-10 space-y-6">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <BarChart3 className="text-secondary" /> Impact Dashboard
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <div className="text-3xl font-extrabold text-secondary">2,450+</div>
                      <div className="text-sm text-slate-300">Challenges Solved</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <div className="text-3xl font-extrabold text-secondary">150+</div>
                      <div className="text-sm text-slate-300">Universities Active</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <div className="text-3xl font-extrabold text-secondary">₹1.2Cr</div>
                      <div className="text-sm text-slate-300">CSR Funds Deployed</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                      <div className="text-3xl font-extrabold text-secondary">98%</div>
                      <div className="text-sm text-slate-300">Citizen Satisfaction</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white tracking-tighter">J-SICP</span>
          </div>
          <p className="text-sm">Built for Smart India Hackathon. A Civic Tech Initiative.</p>
          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-white transition">Login</Link>
            <Link href="/auth/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
// Required for the User icon above which was missed in imports
function User(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
