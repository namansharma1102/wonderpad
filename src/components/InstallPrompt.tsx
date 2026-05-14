'use client'

import React, { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      // Update UI notify the user they can install the PWA
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    
    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-[100] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3">
        <img src="/icon.png" alt="Wonderpad App" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
        <div className="flex flex-col">
          <span className="font-bold text-on-surface text-sm">Install Wonderpad</span>
          <span className="text-xs text-slate-500">Read beautifully offline.</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowPrompt(false)}
          className="text-slate-400 hover:text-slate-600 p-2"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
        <button 
          onClick={handleInstallClick}
          className="bg-[#E8690A] text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
        >
          Install
        </button>
      </div>
    </div>
  )
}
