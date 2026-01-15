import { useState, useEffect, useCallback } from 'react'

interface Template {
  id: string
  name: string
  filename: string
}

type InputMode = 'paste' | 'upload'

// Use /api prefix in production (proxied by nginx), direct URL in development
const API_URL = import.meta.env.DEV ? 'http://localhost:8000' : '/api'

function App() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [inputMode, setInputMode] = useState<InputMode>('paste')
  const [file, setFile] = useState<File | null>(null)
  const [pastedContent, setPastedContent] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/templates`)
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates)
        if (data.templates.length > 0) {
          setSelectedTemplate(data.templates[0].id)
        }
      })
      .catch(() => setError('לא ניתן להתחבר לשרת'))
  }, [])

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
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setError(null)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const hasContent = inputMode === 'paste' ? pastedContent.trim().length > 0 : file !== null

  const handleConvert = async () => {
    if (!hasContent || !selectedTemplate) return

    setIsConverting(true)
    setError(null)

    const formData = new FormData()

    if (inputMode === 'paste') {
      // Create a File object from pasted content
      const blob = new Blob([pastedContent], { type: 'text/markdown' })
      const pastedFile = new File([blob], 'document.md', { type: 'text/markdown' })
      formData.append('file', pastedFile)
    } else {
      formData.append('file', file!)
    }

    formData.append('template', selectedTemplate)

    try {
      const response = await fetch(`${API_URL}/convert`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'שגיאה בהמרה')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Generate filename
      if (inputMode === 'paste') {
        a.download = 'document.docx'
      } else {
        a.download = file!.name.replace(/\.(md|markdown|txt)$/, '.docx')
      }

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה')
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          המרת Markdown ל-Word
        </h1>
        <p className="text-gray-500 text-center mb-8">
          הדבק תוכן או העלה קובץ Markdown וקבל מסמך Word מעוצב
        </p>

        {/* Template Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            בחר תבנית
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setInputMode('paste')}
            className={`
              flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all
              ${inputMode === 'paste'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              הדבק תוכן
            </span>
          </button>
          <button
            onClick={() => setInputMode('upload')}
            className={`
              flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all
              ${inputMode === 'upload'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              העלה קובץ
            </span>
          </button>
        </div>

        {/* Paste Content Area */}
        {inputMode === 'paste' && (
          <div className="mb-4">
            <textarea
              value={pastedContent}
              onChange={(e) => {
                setPastedContent(e.target.value)
                setError(null)
              }}
              placeholder="הדבק כאן את תוכן ה-Markdown שלך..."
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono text-sm"
              dir="auto"
            />
            <p className="text-xs text-gray-400 mt-1">
              {pastedContent.length} תווים
            </p>
          </div>
        )}

        {/* File Upload Area */}
        {inputMode === 'upload' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-4
              ${isDragging
                ? 'border-blue-500 bg-blue-50'
                : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }
            `}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              type="file"
              id="fileInput"
              accept=".md,.markdown,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div>
                <svg className="w-12 h-12 mx-auto text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">לחץ להחלפת קובץ</p>
              </div>
            ) : (
              <div>
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium text-gray-700">גרור קובץ לכאן</p>
                <p className="text-sm text-gray-500 mt-1">או לחץ לבחירת קובץ</p>
                <p className="text-xs text-gray-400 mt-2">.md, .markdown, .txt</p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={!hasContent || !selectedTemplate || isConverting}
          className={`
            w-full mt-4 py-4 rounded-xl font-medium text-lg transition-all
            ${!hasContent || !selectedTemplate || isConverting
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isConverting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              ממיר...
            </span>
          ) : (
            'המר להורדה'
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-6">
          המערכת משתמשת ב-Pandoc להמרה
        </p>
      </div>
    </div>
  )
}

export default App
