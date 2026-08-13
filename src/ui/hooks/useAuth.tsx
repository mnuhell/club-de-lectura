import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { supabase } from '@/src/infrastructure/supabase/client'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  error: string | null
  passwordRecovery: boolean
  signOut: () => Promise<void>
  clearPasswordRecovery: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function parseRecoveryTokens(url: string) {
  const hashIndex = url.indexOf('#')
  if (hashIndex === -1) return null
  const params = new URLSearchParams(url.slice(hashIndex + 1))
  if (params.get('type') !== 'recovery') return null
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  return access_token && refresh_token ? { access_token, refresh_token } : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  async function handleUrl(url: string | null) {
    const tokens = url ? parseRecoveryTokens(url) : null
    if (!tokens) return
    setPasswordRecovery(true)
    await supabase.auth.setSession(tokens)
  }

  useEffect(() => {
    Promise.all([supabase.auth.getSession(), Linking.getInitialURL()])
      .then(async ([{ data }, initialUrl]) => {
        await handleUrl(initialUrl)
        setSession(data.session)
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : 'No se pudo comprobar la sesión')
      })
      .finally(() => setLoading(false))

    const urlSubscription = Linking.addEventListener('url', ({ url }) => handleUrl(url))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      urlSubscription.remove()
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    setPasswordRecovery(false)
    await supabase.auth.signOut()
  }

  function clearPasswordRecovery() {
    setPasswordRecovery(false)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        error,
        passwordRecovery,
        signOut,
        clearPasswordRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
