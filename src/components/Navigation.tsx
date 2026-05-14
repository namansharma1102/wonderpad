'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function Navigation() {
  const pathname = usePathname()
  const [initials, setInitials] = useState<string>('')

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email || 'U'
        setInitials(name.charAt(0).toUpperCase())
      }
    })
  }, [])

  return (
    <>
      {/* TopAppBar (Desktop + Mobile) */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 docked full-width top-0 z-50 font-sans antialiased tracking-tight sticky">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#E8690A] cursor-pointer">menu</span>
            <Link href="/library" className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#E8690A] tracking-tighter">Wonderpad</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/library" 
              className={`font-semibold transition-colors ${pathname === '/library' ? 'text-[#E8690A]' : 'text-slate-600 dark:text-slate-400 hover:text-[#E8690A]'}`}
            >
              Library
            </Link>
            <Link 
              href="/discover" 
              className={`font-semibold transition-colors ${pathname === '/discover' ? 'text-[#E8690A]' : 'text-slate-600 dark:text-slate-400 hover:text-[#E8690A]'}`}
            >
              Discover
            </Link>
            <Link 
              href="/stats" 
              className={`font-semibold transition-colors ${pathname === '/stats' ? 'text-[#E8690A]' : 'text-slate-600 dark:text-slate-400 hover:text-[#E8690A]'}`}
            >
              Stats
            </Link>
            <Link 
              href="/settings" 
              className={`font-semibold transition-colors ${pathname === '/settings' ? 'text-[#E8690A]' : 'text-slate-600 dark:text-slate-400 hover:text-[#E8690A]'}`}
            >
              Settings
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/settings">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden cursor-pointer active:opacity-70 transition-opacity">
                <span className="text-[#E8690A] font-bold text-sm">{initials}</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom Nav Bar (Mobile only) */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-between items-center px-6 py-3 pb-safe md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-[99] select-none">
        <Link 
          href="/library"
          className={`flex flex-col items-center justify-center transition-transform active:scale-90 w-16 h-12 rounded-full ${
            pathname === '/library' ? 'text-[#E8690A] bg-orange-50 dark:bg-orange-950/30' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/library' ? "'FILL' 1" : "'FILL' 0" }}>library_books</span>
          <span className="text-[10px] uppercase font-bold tracking-widest font-sans mt-0.5">Library</span>
        </Link>

        <Link 
          href="/discover"
          className={`flex flex-col items-center justify-center transition-transform active:scale-90 w-16 h-12 rounded-full ${
            pathname === '/discover' ? 'text-[#E8690A] bg-orange-50 dark:bg-orange-950/30' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/discover' ? "'FILL' 1" : "'FILL' 0" }}>explore</span>
          <span className="text-[10px] uppercase font-bold tracking-widest font-sans mt-0.5">Discover</span>
        </Link>

        <Link 
          href="/stats"
          className={`flex flex-col items-center justify-center transition-transform active:scale-90 w-16 h-12 rounded-full ${
            pathname === '/stats' ? 'text-[#E8690A] bg-orange-50 dark:bg-orange-950/30' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/stats' ? "'FILL' 1" : "'FILL' 0" }}>bar_chart</span>
          <span className="text-[10px] uppercase font-bold tracking-widest font-sans mt-0.5">Stats</span>
        </Link>

        <Link 
          href="/settings"
          className={`flex flex-col items-center justify-center transition-transform active:scale-90 w-16 h-12 rounded-full ${
            pathname === '/settings' ? 'text-[#E8690A] bg-orange-50 dark:bg-orange-950/30' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/settings' ? "'FILL' 1" : "'FILL' 0" }}>settings</span>
          <span className="text-[10px] uppercase font-bold tracking-widest font-sans mt-0.5">Settings</span>
        </Link>
      </nav>
    </>
  )
}
