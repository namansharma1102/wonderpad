'use client'

import { useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

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
    setSuccessMsg(null)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      setSuccessMsg('Account created! Check your email to confirm, then sign in.')
    }
    setLoading(false)
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
    <div className="bg-surface font-ui-body text-on-background min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center px-lg py-xl lg:justify-start lg:pl-32">
        <div className="w-full max-w-[400px] flex flex-col items-center">
          {/* Brand Identity */}
          <div className="mb-xl text-center">
            <div className="flex items-center justify-center gap-sm mb-md">
              <span className="material-symbols-outlined text-primary text-3xl">menu_book</span>
              <span className="font-display-lg text-headline-md text-primary tracking-tight">Wonderpad</span>
            </div>
            <h1 className="font-display-lg text-headline-md text-on-surface mb-xs">Create your account</h1>
            <p className="font-ui-body text-on-surface-variant">Start reading beautifully.</p>
          </div>

          {/* Social Auth */}
          <div className="w-full space-y-md">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-md py-md px-lg bg-surface-container-lowest border border-outline-variant rounded-full font-label-sm text-on-surface hover:bg-surface-container-low transition-colors duration-200"
            >
              <img 
                alt="Google" 
                className="w-5 h-5" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa7sGq5wZ5guIjtCGwIhaTeRyKd3GXvN6CO5ZbmyFcAs_UaNzMjyb2DO-9-kzjzk1ditquZaQ6j5BwHlih46GzW9JZB5yYwh4VDL4uViJt2XmzcjwH-Qt14xejDj3ab7xAnjWgZ21tBBORzipwUNRyCIFPDbj9bF5fn0G-BJ4Y8hT-YmskI9PXmia4WnT-IVK_OFWgkCW7IQP6y22eZQSKEvkkmPGiG_o36sO460_iBk8TqpxqwJVrt_Y-1fN2_V6q8UtApJCFgeo" 
              />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-md">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="flex-shrink mx-md font-label-sm text-outline uppercase tracking-widest text-[10px]">or</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="w-full bg-error-container text-on-error-container p-3 rounded-lg mb-4 text-sm font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="w-full bg-[#d4edda] text-[#155724] p-3 rounded-lg mb-4 text-sm font-medium text-center">
                {successMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-md w-full">
              <div className="space-y-xs">
                <label className="block font-label-sm text-outline uppercase text-[11px] ml-sm" htmlFor="email">
                  Email address
                </label>
                <input
                  className="w-full px-lg py-md rounded-full bg-surface-container border-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 text-on-surface placeholder:text-outline/60"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-xs">
                <label className="block font-label-sm text-outline uppercase text-[11px] ml-sm" htmlFor="password">
                  Password
                </label>
                <input
                  className="w-full px-lg py-md rounded-full bg-surface-container border-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 text-on-surface placeholder:text-outline/60"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button
                className="w-full py-md bg-primary text-on-primary font-label-sm rounded-full hover:bg-primary-container transition-all duration-300 shadow-sm hover:shadow-md mt-md disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <p className="mt-xl font-ui-body text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link className="text-primary font-semibold hover:underline decoration-primary/30 underline-offset-4" href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      {/* Backdrop Decorative Element */}
      <div className="hidden lg:block fixed right-0 top-0 h-full w-1/2 bg-surface-container-high overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCUhOLE2M5AuC-FSYIWzRmsL64851UWsb3VuVQ84A9W4aTQsEpsfJXheGp1hsj7WVmccU0Drx7irCvh3GDdZAmqz4kJD042hD-O4rPuR2g86g6OHCmEKcW6rAbq5SGKoS1Tb-iwQFPgnOhRfKriAl_y5Tz-bA9yLuw054YBA2x7QhydxlxN5LYUs33q-r-WYzQX3Ur1za7FZc5xyd2wNOyjbCVaRfOw4I7hZkwzWZtBtyN29nWYhqGIF99bgxJEFI7BYTSgXjXIt0I')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        >
        </div>
        <div className="h-full w-full flex items-center justify-center p-xl relative z-10">
          <div className="max-w-md text-primary">
            <blockquote className="font-reader-body text-display-lg italic opacity-80 leading-tight">
              &ldquo;Reading is a conversation. All books talk. But a good book listens as well.&rdquo;
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  )
}
