'use client'

import { useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const supabase = useMemo(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/library'
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="bg-background font-ui-body text-on-surface antialiased min-h-screen flex flex-col items-center">
      <main className="w-full max-w-md px-6 py-12 flex flex-col items-center justify-center grow">
        {/* Brand Header */}
        <header className="flex flex-col items-center gap-4 mb-10">
          <div className="flex items-center gap-2 text-xl font-bold text-wonderpad-orange">
            <span className="material-symbols-outlined">menu_book</span>
            <span>Wonderpad</span>
          </div>
          <div className="text-center">
            <h1 className="font-headline-md text-headline-md text-on-surface mb-1">Welcome back.</h1>
            <p className="font-ui-body text-ui-body text-secondary">Sign in to continue reading.</p>
          </div>
        </header>

        {/* Social Login */}
        <div className="w-full space-y-4 mb-8">
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 border border-outline-variant bg-white rounded-full font-ui-body font-semibold text-on-surface hover:bg-surface-container-low transition-colors duration-200"
          >
            <svg height="20" viewBox="0 0 20 20" width="20">
              <path d="M19.6 10.23c0-.66-.06-1.29-.17-1.91H10v3.61h5.38c-.23 1.25-.94 2.31-2 3.03v2.51h3.25c1.9-1.75 3-4.32 3-7.24z" fill="#4285F4"></path>
              <path d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.25-2.51c-.9.61-2.06.97-3.37.97-2.6 0-4.8-1.75-5.58-4.12H1.22v2.59C2.88 17.75 6.2 20 10 20z" fill="#34A853"></path>
              <path d="M4.42 11.92c-.2-.61-.31-1.25-.31-1.92s.11-1.31.31-1.92V5.49H1.22A9.976 9.976 0 0 0 0 10c0 1.63.39 3.17 1.08 4.54l3.34-2.62z" fill="#FBBC05"></path>
              <path d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.87-2.87C14.95.96 12.7 0 10 0 6.2 0 2.88 2.25 1.22 5.49l3.2 2.51c.78-2.37 2.98-4.12 5.58-4.12z" fill="#EA4335"></path>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 mb-8">
          <div className="h-[1px] flex-grow bg-outline-variant"></div>
          <span className="font-label-sm text-label-sm text-secondary tracking-widest">OR</span>
          <div className="h-[1px] flex-grow bg-outline-variant"></div>
        </div>

        {/* Error */}
        {error && (
          <div className="w-full bg-error-container text-on-error-container p-3 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Manual Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="space-y-2">
            <label className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <div className="relative rounded-xl transition-all">
              <input
                className="w-full px-4 py-4 bg-slate-50 border border-outline-variant rounded-xl focus:border-wonderpad-orange focus:ring-0 focus:outline-none text-on-surface placeholder:text-secondary/50"
                id="email"
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <div className="relative group rounded-xl transition-all">
              <input
                className="w-full px-4 py-4 bg-slate-50 border border-outline-variant rounded-xl focus:border-wonderpad-orange focus:ring-0 focus:outline-none text-on-surface placeholder:text-secondary/50"
                id="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-wonderpad-orange" 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <div className="flex justify-end">
              <Link className="font-label-sm text-label-sm text-wonderpad-orange hover:underline font-semibold" href="/forgot-password">
                Forgot password?
              </Link>
            </div>
          </div>
          <button
            className="w-full py-4 bg-wonderpad-orange text-white rounded-full font-headline-md text-ui-body font-bold hover:brightness-110 transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-12 text-center">
          <p className="font-ui-body text-ui-body text-secondary">
            New to Wonderpad?{' '}
            <Link className="text-wonderpad-orange font-bold hover:underline" href="/signup">
              Create an account
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto py-12 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 max-w-7xl mx-auto gap-4">
          <div className="text-lg font-bold text-orange-600 dark:text-orange-500">Wonderpad</div>
          <p className="text-sm font-inter text-slate-500 dark:text-slate-400">© 2024 Wonderpad. Read the new way.</p>
          <div className="flex gap-6">
            <Link className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors" href="#">Privacy</Link>
            <Link className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors" href="#">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
