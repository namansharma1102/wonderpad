'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setSuccessMsg('Account created! Check your email to confirm, then log in.')
        setIsSignUp(false)
        setLoading(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/library')
        router.refresh()
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9ff] p-4 font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e5eeff] p-8">
        <h1 className="text-2xl font-bold text-[#0b1c30] mb-6 text-center">
          {isSignUp ? 'Create your account' : 'Log in to Wonderpad'}
        </h1>
        
        {error && (
          <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-[#d4edda] text-[#155724] p-3 rounded-lg mb-4 text-sm font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#565e74] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#f1f5f9] border border-[#e5eeff] rounded-xl focus:border-[#E8690A] focus:outline-none transition-colors text-[#0b1c30]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#565e74] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 bg-[#f1f5f9] border border-[#e5eeff] rounded-xl focus:border-[#E8690A] focus:outline-none transition-colors text-[#0b1c30]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8690A] text-white font-bold py-3 rounded-full hover:bg-[#c05400] transition-colors disabled:opacity-50 mt-4"
          >
            {loading
              ? (isSignUp ? 'Creating account...' : 'Logging in...')
              : (isSignUp ? 'Sign Up' : 'Log In')
            }
          </button>
        </form>

        <p className="text-center text-sm text-[#565e74] mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setSuccessMsg(null)
            }}
            className="text-[#E8690A] font-semibold hover:underline"
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
