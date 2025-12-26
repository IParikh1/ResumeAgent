import React, { useState, useRef, useEffect } from 'react'
import { Send, RefreshCw, User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import axios from 'axios'
import './ChatInterface.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  sessionId: string
  initialAnalysis: string
  onNewSession: () => void
}

function ChatInterface({ sessionId, initialAnalysis, onNewSession }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialAnalysis }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await axios.post('/api/chat', {
        message: userMessage,
        session_id: sessionId
      })

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = [
    "How can I improve my bullet points?",
    "Is my resume ATS-friendly?",
    "What skills should I highlight for FAANG?",
    "Can you rewrite my experience section?"
  ]

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <Bot size={24} />
          <span>Resume Expert</span>
        </div>
        <button className="new-session-btn" onClick={onNewSession}>
          <RefreshCw size={18} />
          New Resume
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-icon">
              {message.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="message-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-icon">
              <Bot size={20} />
            </div>
            <div className="message-content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="suggested-questions">
          {suggestedQuestions.map((q, i) => (
            <button key={i} onClick={() => setInput(q)} className="suggestion">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your resume..."
          rows={1}
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}

export default ChatInterface
