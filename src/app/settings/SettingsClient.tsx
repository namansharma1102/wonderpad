'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface SettingsClientProps {
  user: any
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="bg-[#F2F2F7] min-h-screen font-ui-body text-on-surface antialiased">
      {/* Top App Bar */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 fixed top-0 w-full z-50 h-16 flex justify-between items-center px-4">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 text-[#E8690A] transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <div className="flex-grow text-center">
          <h1 className="text-on-surface font-headline-md text-base font-bold">Settings</h1>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="max-w-[600px] mx-auto pt-24 pb-32 px-4 space-y-8">
        {/* Account Section */}
        <section>
          <h2 className="px-4 mb-2 text-[11px] font-black uppercase text-slate-400 tracking-widest">Account</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            {/* Profile Row */}
            <div className="flex items-center p-4 border-b border-slate-100">
              <div className="w-14 h-14 bg-orange-100 text-[#E8690A] rounded-full flex items-center justify-center font-bold text-lg mr-4 overflow-hidden border border-orange-200">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-on-surface">{name}</span>
                <span className="text-slate-400 text-sm">{user.email}</span>
              </div>
            </div>
            {/* Change Password */}
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <span className="text-on-surface font-medium">Security & Password</span>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Reading Defaults Section */}
        <section>
          <h2 className="px-4 mb-2 text-[11px] font-black uppercase text-slate-400 tracking-widest">Reading Defaults</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="text-on-surface font-medium">Default Theme</span>
              <div className="flex items-center text-slate-400 text-sm">
                <span className="mr-2">Sepia</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="text-on-surface font-medium">Text Size</span>
              <div className="flex items-center text-slate-400 text-sm">
                <span className="mr-2">18px</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <span className="text-on-surface font-medium">Primary Font</span>
              <div className="flex items-center text-slate-400 text-sm">
                <span className="mr-2">Newsreader</span>
                <span className="material-symbols-outlined text-slate-300">chevron_right</span>
              </div>
            </button>
          </div>
        </section>

        {/* About Section */}
        <section>
          <h2 className="px-4 mb-2 text-[11px] font-black uppercase text-slate-400 tracking-widest">About</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="text-on-surface font-medium">Version</span>
              <span className="text-slate-400 text-sm font-bold">1.2.4</span>
            </div>
            <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="text-on-surface font-medium">Privacy Policy</span>
              <span className="material-symbols-outlined text-slate-300">open_in_new</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <span className="text-on-surface font-medium">Terms of Service</span>
              <span className="material-symbols-outlined text-slate-300">open_in_new</span>
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="px-4 mb-2 text-[11px] font-black uppercase text-red-500 tracking-widest">Danger Zone</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-red-100">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
            >
              <span className="text-red-600 font-bold">Sign Out</span>
              <span className="material-symbols-outlined text-red-600">logout</span>
            </button>
          </div>
        </section>

        <div className="mt-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#E8690A] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
            </div>
          </div>
          <p className="text-[#E8690A] font-black text-[11px] uppercase tracking-[0.2em]">Wonderpad</p>
          <p className="text-xs text-slate-400 mt-2">Crafted with passion for readers.</p>
        </div>
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 pb-safe bg-white/90 backdrop-blur-md border-t border-slate-200">
        <button 
          onClick={() => router.push('/library')}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-[#E8690A] transition-transform active:scale-90"
        >
          <span className="material-symbols-outlined">library_books</span>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Library</span>
        </button>
        <button className="flex flex-col items-center justify-center text-slate-400 hover:text-[#E8690A] transition-transform active:scale-90">
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Discover</span>
        </button>
        <button className="flex flex-col items-center justify-center text-[#E8690A] transition-transform active:scale-90">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Settings</span>
        </button>
      </nav>
    </div>
  )
}
