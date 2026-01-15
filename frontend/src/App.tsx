import { useState, useEffect, useCallback } from 'react'

interface Template {
  id: string
  name: string
  filename: string
}

type InputMode = 'paste' | 'upload'
type Theme = 'light' | 'dark'

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
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as Theme) || 'light'
  })

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

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

  const isDark = theme === 'dark'

  return (
    <div dir="rtl" className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100'}`}>
      {/* Header */}
      <header className={`backdrop-blur-md border-b transition-colors duration-300 ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/70 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>MD to DOCX</h1>
                <p className={`text-xs sm:text-sm hidden sm:block ${isDark ? 'text-blue-200' : 'text-gray-500'}`}>המרת Markdown למסמכי Word</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-xs hidden md:block ${isDark ? 'text-blue-300/60' : 'text-gray-400'}`}>
                Powered by Pandoc
              </div>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-yellow-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                title={isDark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">

          {/* Left Panel - Input Area */}
          <div className="lg:col-span-2 flex flex-col">
            <div className={`backdrop-blur-md rounded-2xl border p-4 sm:p-6 flex-1 flex flex-col transition-colors duration-300 ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/80 border-gray-200 shadow-lg'}`}>

              {/* Input Mode Toggle */}
              <div className={`flex mb-4 sm:mb-6 rounded-xl p-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setInputMode('paste')}
                  className={`
                    flex-1 py-2.5 sm:py-3 px-4 rounded-lg text-sm font-medium transition-all
                    ${inputMode === 'paste'
                      ? 'bg-white text-blue-600 shadow-lg'
                      : isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
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
                      : isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
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
                    className={`flex-1 w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono text-sm ${isDark ? 'bg-slate-900/50 border-white/20 text-white placeholder-white/40' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'}`}
                    dir="auto"
                  />
                  <div className={`flex justify-between items-center mt-3 text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
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
                        ? isDark ? 'border-green-400 bg-green-500/20' : 'border-green-500 bg-green-50'
                        : isDark ? 'border-white/30 hover:border-blue-400 hover:bg-white/5' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
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
                      <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                        <svg className={`w-10 h-10 sm:w-12 sm:h-12 ${isDark ? 'text-green-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className={`text-lg sm:text-xl font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{file.name}</p>
                      <p className={`text-sm mt-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>לחץ להחלפת קובץ</p>
                    </div>
                  ) : (
                    <div>
                      <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <svg className={`w-10 h-10 sm:w-12 sm:h-12 ${isDark ? 'text-white/50' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className={`text-lg sm:text-xl font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>גרור קובץ לכאן</p>
                      <p className={`text-sm mt-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>או לחץ לבחירת קובץ</p>
                      <div className="flex gap-2 justify-center mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-600'}`}>.md</span>
                        <span className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-600'}`}>.markdown</span>
                        <span className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-600'}`}>.txt</span>
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
            <div className={`backdrop-blur-md rounded-2xl border p-4 sm:p-6 transition-colors duration-300 ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/80 border-gray-200 shadow-lg'}`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        : isDark ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
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
              <div className={`p-4 backdrop-blur-md border rounded-xl text-sm flex items-start gap-3 ${isDark ? 'bg-red-500/20 border-red-500/30 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
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
                  ? isDark ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
            <div className={`backdrop-blur-md rounded-xl border p-4 text-center transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                תומך ב-Markdown עם עברית ו-RTL
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/50 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={`text-center text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            המערכת משתמשת ב-Pandoc להמרה מדויקת של Markdown למסמכי Word
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
