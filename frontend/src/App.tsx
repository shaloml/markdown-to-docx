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
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">MD to DOCX</h1>
                <p className="text-xs sm:text-sm text-blue-200 hidden sm:block">המרת Markdown למסמכי Word</p>
              </div>
            </div>
            <div className="text-xs text-blue-300/60 hidden md:block">
              Powered by Pandoc
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">

          {/* Left Panel - Input Area */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-6 flex-1 flex flex-col">

              {/* Input Mode Toggle */}
              <div className="flex mb-4 sm:mb-6 bg-white/10 rounded-xl p-1">
                <button
                  onClick={() => setInputMode('paste')}
                  className={`
                    flex-1 py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium transition-all
                    ${inputMode === 'paste'
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">הדבק תוכן</span>
                    <span className="sm:hidden">הדבק</span>
                  </span>
                </button>
                <button
                  onClick={() => setInputMode('upload')}
                  className={`
                    flex-1 py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium transition-all
                    ${inputMode === 'upload'
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="hidden sm:inline">העלה קובץ</span>
                    <span className="sm:hidden">העלה</span>
                  </span>
                </button>
              </div>

              {/* Paste Content Area */}
              {inputMode === 'paste' && (
                <div className="flex-1 flex flex-col min-h-[300px] sm:min-h-[400px]">
                  <textarea
                    value={pastedContent}
                    onChange={(e) => {
                      setPastedContent(e.target.value)
                      setError(null)
                    }}
                    placeholder="הדבק כאן את תוכן ה-Markdown שלך..."
                    className="flex-1 w-full px-4 py-4 bg-slate-900/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono text-sm text-white placeholder-white/40"
                    dir="auto"
                  />
                  <div className="flex justify-between items-center mt-3 text-xs text-white/40">
                    <span>{pastedContent.length.toLocaleString()} תווים</span>
                    <span>{pastedContent.split('\n').length} שורות</span>
                  </div>
                </div>
              )}

              {/* File Upload Area */}
              {inputMode === 'upload' && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    flex-1 min-h-[300px] sm:min-h-[400px] border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                    ${isDragging
                      ? 'border-blue-400 bg-blue-500/20'
                      : file
                        ? 'border-green-400 bg-green-500/20'
                        : 'border-white/30 hover:border-blue-400 hover:bg-white/5'
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
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-lg sm:text-xl font-medium text-white">{file.name}</p>
                      <p className="text-sm text-white/50 mt-2">לחץ להחלפת קובץ</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-lg sm:text-xl font-medium text-white">גרור קובץ לכאן</p>
                      <p className="text-sm text-white/50 mt-2">או לחץ לבחירת קובץ</p>
                      <div className="flex gap-2 justify-center mt-4">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">.md</span>
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">.markdown</span>
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">.txt</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="flex flex-col gap-4 sm:gap-6">

            {/* Template Selector Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                בחר תבנית
              </h2>
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`
                      w-full px-4 py-3 rounded-xl text-right transition-all flex items-center justify-between
                      ${selectedTemplate === template.id
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      }
                    `}
                  >
                    <span className="font-medium">{template.name}</span>
                    {selectedTemplate === template.id && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl text-red-200 text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!hasContent || !selectedTemplate || isConverting}
              className={`
                w-full py-4 sm:py-5 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3
                ${!hasContent || !selectedTemplate || isConverting
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98] shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40'
                }
              `}
            >
              {isConverting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  ממיר...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  המר והורד
                </>
              )}
            </button>

            {/* Info Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 text-center">
              <p className="text-xs text-white/40">
                תומך ב-Markdown עם עברית ו-RTL
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/5 border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-white/30">
            המערכת משתמשת ב-Pandoc להמרה מדויקת של Markdown למסמכי Word
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
