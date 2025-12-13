'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4">Feil</h1>
              <p className="text-3xl text-muted-foreground mb-4">
                {this.state.error?.message || 'En uventet feil oppstod'}
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-xl font-semibold"
              >
                Last inn på nytt
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

