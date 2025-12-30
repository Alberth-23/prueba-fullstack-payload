'use client'

import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="full-page-center">
      <div className="unauth-card">
        <h1>Acceso denegado</h1>
        <p>No tienes permisos para acceder a esta sección.</p>
        <div className="unauth-card__actions">
          <Link href="/">
            <button>Ir al Dashboard</button>
          </Link>
          <Link href="/login">
            <button className="secondary">Iniciar sesión con otra cuenta</button>
          </Link>
        </div>
      </div>
    </div>
  )
}
