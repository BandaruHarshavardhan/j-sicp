"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  FileText, 
  GraduationCap, 
  Building2, 
  Handshake, 
  Activity, 
  CheckSquare, 
  Globe2, 
  Bell
} from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Challenges", href: "/dashboard/admin/challenges", icon: FileText },
    { name: "Universities", href: "/dashboard/admin/universities", icon: GraduationCap },
    { name: "Industries", href: "/dashboard/admin/industries", icon: Building2 },
    { name: "Collaborations", href: "/dashboard/admin/collaborations", icon: Handshake },
    { name: "Projects", href: "/dashboard/admin/projects", icon: Activity },
    { name: "Verification", href: "/dashboard/admin/verification", icon: CheckSquare },
    { name: "Impact & Outcomes", href: "/dashboard/admin/impact", icon: Globe2 },
    { name: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
  ]

  return (
    <div className="w-64 bg-slate-900 min-h-[calc(100vh-4rem)] flex flex-col border-r border-slate-800 shrink-0 hidden md:flex">
      <div className="p-6 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        Government Monitor
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive 
                  ? "bg-primary text-white" 
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
