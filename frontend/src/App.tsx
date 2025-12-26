import React, { useState } from 'react'
import ResumeUpload from './components/ResumeUpload'
import ChatInterface from './components/ChatInterface'
import './App.css'

interface SessionData {
  sessionId: string
  initialAnalysis: string
}

function App() {
  const [session, setSession] = useState<SessionData | null>(null)

  const handleUploadComplete = (sessionId: string, initialAnalysis: string) => {
    setSession({ sessionId, initialAnalysis })
  }

  const handleNewSession = () => {
    setSession(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Resume Review Agent</h1>
        <p>Expert AI with 20 years of tech hiring experience</p>
      </header>

      <main className="app-main">
        {!session ? (
          <ResumeUpload onUploadComplete={handleUploadComplete} />
        ) : (
          <ChatInterface
            sessionId={session.sessionId}
            initialAnalysis={session.initialAnalysis}
            onNewSession={handleNewSession}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Claude AI | Expertise in Tech, IT & Engineering</p>
      </footer>
    </div>
  )
}

export default App
