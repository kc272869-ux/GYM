/**
 * components/ui/ErrorBoundary.jsx
 * --------------------------------
 * Captura errores de renderizado de React y muestra una pantalla de error
 * en vez de dejar la pantalla en negro.
 *
 * React solo soporta ErrorBoundary como clase (no hay hook equivalente aún).
 */
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Error desconocido' }
  }

  componentDidCatch(error, info) {
    // En desarrollo puedes ver el error en consola
    console.error('ErrorBoundary capturó:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-6">
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-5xl">⚠️</p>
            <h2 className="text-xl font-bold text-white">Algo salió mal</h2>
            <p className="text-gray-400 text-sm">{this.state.message}</p>
            <p className="text-gray-600 text-xs">
              Si el error persiste, asegúrate de haber ejecutado el SQL en Supabase
              y de que las variables de entorno estén configuradas en Vercel.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
