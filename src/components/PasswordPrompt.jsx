import { useState, useEffect } from 'react'
import { Lock, Play, ShieldAlert } from 'lucide-react'
import { md5 } from '../utils/md5.js'
// hash 6285 authed = b7ae8fecf15b8b6c3c69eceae636d203
// hash 6286 new hash = caa145542f7333f6ebf99a72b87bdeba
const STORED_HASH = '57827ddd068a17ad6dfc6690962241e5'
// Increment this version to force all users to log out and re-enter the password
const AUTH_VERSION = '1.0.2'

export default function PasswordPrompt({ onAuthenticated }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [isLocked, setIsLocked] = useState(true)

  useEffect(() => {
    // Check if already authenticated in this session and version matches
    const auth = sessionStorage.getItem('site_auth')
    const savedVersion = sessionStorage.getItem('site_auth_version')

    if (auth === 'true' && savedVersion === AUTH_VERSION) {
      onAuthenticated()
      setIsLocked(false)
    } else if (auth === 'true' && savedVersion !== AUTH_VERSION) {
      // Force logout if version changed
      sessionStorage.removeItem('site_auth')
      sessionStorage.removeItem('site_auth_version')
    }
  }, [onAuthenticated])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Hash the entered password and compare
    const enteredHash = md5(password)

    if (enteredHash === STORED_HASH) {
      sessionStorage.setItem('site_auth', 'true')
      sessionStorage.setItem('site_auth_version', AUTH_VERSION)
      onAuthenticated()
      setIsLocked(false)
    } else {
      setError(true)
      setPassword('')
      // Shake animation effect could be added here
      setTimeout(() => setError(false), 2000)
    }
  }

  if (!isLocked) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-darker overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-secondary/20 rounded-full blur-[120px] animate-pulse"></div>

      <div className="relative w-full max-w-md p-8 mx-4 bg-dark/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Logo/Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Lock className="text-white" size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Restricted Access
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Please enter the 4-digit security code to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative group">
              <input
                type="password"
                maxLength={4}
                value={password}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '') // Only allow digits
                  setPassword(val)
                  if (error) setError(false)
                }}
                autoFocus
                placeholder="••••"
                className={`w-full py-4 bg-white/5 border-2 rounded-2xl text-center text-3xl tracking-[1em] font-mono text-white placeholder-gray-600 focus:outline-none transition-all ${
                  error 
                    ? 'border-red-500/50 bg-red-500/5 animate-shake' 
                    : 'border-white/10 focus:border-primary/50 focus:bg-white/10'
                }`}
              />
              {error && (
                <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-2 text-red-400 text-xs animate-fade-in">
                  <ShieldAlert size={14} />
                  <span>Invalid password. Try again.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={password.length !== 4}
              className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:from-white/5 disabled:to-white/5 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              Unlock Access
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
