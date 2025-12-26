import React, { useState, useCallback } from 'react'
import { Upload, FileText, Loader } from 'lucide-react'
import axios from 'axios'
import './ResumeUpload.css'

interface Props {
  onUploadComplete: (sessionId: string, initialAnalysis: string) => void
}

function ResumeUpload({ onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }

  const uploadFile = async (file: File) => {
    // Validate file type
    const validTypes = ['.pdf', '.docx', '.doc', '.txt']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.includes(fileExt)) {
      setError('Please upload a PDF, DOCX, or TXT file')
      return
    }

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      onUploadComplete(response.data.session_id, response.data.initial_analysis)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload resume')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="upload-container">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="upload-loading">
            <Loader className="spinner" size={48} />
            <p>Analyzing your resume...</p>
            <span>Our expert is reviewing with 20 years of hiring experience</span>
          </div>
        ) : (
          <>
            <Upload size={48} className="upload-icon" />
            <h2>Upload Your Resume</h2>
            <p>Drag & drop your resume here, or click to browse</p>
            <span className="file-types">Supports PDF, DOCX, TXT</span>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              className="file-input"
            />
          </>
        )}
      </div>

      {error && <div className="upload-error">{error}</div>}

      <div className="features">
        <div className="feature">
          <FileText size={24} />
          <h3>Expert Analysis</h3>
          <p>Get feedback from an AI with 20+ years of tech hiring expertise</p>
        </div>
        <div className="feature">
          <FileText size={24} />
          <h3>ATS Optimized</h3>
          <p>Ensure your resume passes Applicant Tracking Systems</p>
        </div>
        <div className="feature">
          <FileText size={24} />
          <h3>FAANG Ready</h3>
          <p>Tailored advice for top tech company applications</p>
        </div>
      </div>
    </div>
  )
}

export default ResumeUpload
