"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Menu, X, User } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  const getDashboardLink = () => {
    switch(session?.user?.role) {
      case "CITIZEN": return "/dashboard/citizen"
      case "INSTITUTION": return "/dashboard/institution"
      case "INDUSTRY": return "/dashboard/industry"
      case "ADMIN": return "/dashboard/admin"
      default: return "/dashboard"
    }
  }

  return (
    <nav className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tighter">J-SICP</span>
              <span className="hidden md:block text-xs uppercase tracking-widest text-secondary font-medium ml-2 border-l border-white/20 pl-2">
                Civic Innovation
              </span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link href="/explore" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition">
                Explore Challenges
              </Link>
              <Link href="/report" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition">
                Report a Problem
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center gap-4">
                <Link href={getDashboardLink()} className="text-sm font-medium hover:text-secondary transition">
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                  <User size={16} />
                  <span>{session.user.name}</span>
                </div>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white text-primary hover:bg-slate-100 transition shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/auth/login" className="px-4 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition">
                  Login
                </Link>
                <Link href="/auth/register" className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-white hover:bg-accent transition shadow-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-primary pb-3 border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/explore" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10">
              Explore Challenges
            </Link>
            <Link href="/report" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10">
              Report a Problem
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-white/10">
            {session ? (
              <div className="px-2 space-y-1">
                <Link href={getDashboardLink()} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10">
                  Dashboard
                </Link>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                <Link href="/auth/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-white/10">
                  Login
                </Link>
                <Link href="/auth/register" className="block px-3 py-2 rounded-md text-base font-medium bg-secondary text-white hover:bg-accent mt-2 text-center">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
