import React from 'react'
import { MainLayout } from './components/MainLayout'
import { ErrorBoundary } from './components/ErrorBoundary'

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <MainLayout />
    </ErrorBoundary>
  )
}

export default App
