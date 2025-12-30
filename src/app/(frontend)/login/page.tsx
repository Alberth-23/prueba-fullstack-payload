'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') router.replace('/')
      else router.replace('/inventario')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="full-page-center">
        <div className="spinner" />
      </div>
    )
  }

  if (user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const result = await login(email, password)

    setSubmitting(false)

    if (result.success) {
      if (result.role === 'admin') {
        router.push('/')
      } else {
        router.push('/inventario')
      }
    } else {
      setError(result.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Iniciar sesión</h1>
        <p className="auth-card__subtitle">Sistema de gestión con Payload</p>

        {error && <div className="auth-card__error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-form__field">
            <span>Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className="auth-form__field">
            <span>Contraseña</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button className="auth-form__submit" type="submit" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-card__hint">
          Panel de administración:{' '}
          <a href="/admin" target="_blank" rel="noreferrer">
            /admin
          </a>
        </p>
      </div>
    </div>
  )
}
