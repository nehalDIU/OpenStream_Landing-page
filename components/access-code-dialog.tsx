"use client"

import { useState, useCallback, useMemo, memo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, AlertCircle, CheckCircle, MessageCircle, ExternalLink, Info } from "lucide-react"
import { toast } from "sonner"

interface AccessCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// Memoized component for better performance
export const AccessCodeDialog = memo(function AccessCodeDialog({ open, onOpenChange, onSuccess }: AccessCodeDialogProps) {
  const [code, setCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")

  // Memoized validation states
  const isCodeValid = useMemo(() => code.length === 8, [code.length])
  const isSubmitDisabled = useMemo(() => isValidating || !isCodeValid, [isValidating, isCodeValid])

  // Optimized input handler with useCallback
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(value)
    if (error) setError("")
  }, [error])

  // Optimized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      setError("Please enter an access code")
      return
    }

    if (code.trim().length !== 8) {
      setError("Access code must be 8 characters long")
      return
    }

    setIsValidating(true)
    setError("")

    try {
      const response = await fetch('/api/access-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          code: code.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.valid) {
        toast.success("Access code validated successfully!", {
          description: "Connecting to premium servers..."
        })
        onSuccess()
        onOpenChange(false)
        setCode("")
        setError("")
      } else {
        const errorMessage = data.error || "Invalid access code"
        setError(errorMessage)
        toast.error(errorMessage, {
          description: "Please check your code and try again"
        })
      }
    } catch (error) {
      console.error('Validation error:', error)
      const errorMessage = "Failed to validate access code. Please check your connection and try again."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsValidating(false)
    }
  }, [code, onSuccess, onOpenChange])

  // Optimized close handler
  const handleClose = useCallback(() => {
    setCode("")
    setError("")
    onOpenChange(false)
  }, [onOpenChange])

  // Optimized Telegram group handler
  const openTelegramGroup = useCallback(() => {
    // Track user interaction for analytics
    if (typeof window !== 'undefined') {
      // Google Analytics tracking (if available)
      const gtag = (window as any).gtag
      if (typeof gtag === 'function') {
        gtag('event', 'telegram_group_click', {
          event_category: 'engagement',
          event_label: 'access_code_dialog'
        })
      }
    }
    
    window.open("https://t.me/openstream3", "_blank", "noopener,noreferrer")
  }, [])

  // Structured data for SEO
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "OpenStream Premium Access",
    "description": "Premium content streaming server access with temporary access codes",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free access codes available through Telegram community"
    },
    "provider": {
      "@type": "Organization",
      "name": "OpenStream",
      "url": "https://t.me/openstream3"
    }
  }), [])

  return (
    <>
      {/* SEO and structured data */}
      {open && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[600px] xl:w-[650px] max-w-none h-[95vh] sm:h-[90vh] md:h-auto max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center leading-tight">
            Premium Server Access
          </DialogTitle>
          
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <DialogDescription className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed text-center px-2">
              Connect to our premium content servers with your temporary access code for enhanced streaming experience.
            </DialogDescription>

            <div className="text-center">
              <div 
                className="mx-auto w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                role="img"
                aria-label="Security shield icon"
              >
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" aria-hidden="true" />
              </div>
            </div>

            {/* Get Access Code Section */}
            <section 
              className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 sm:p-4 md:p-5 border border-blue-100 dark:border-blue-900"
              aria-labelledby="get-code-heading"
            >
              <div className="text-center space-y-2 sm:space-y-3">
                <h3 
                  id="get-code-heading"
                  className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base md:text-lg"
                >
                  Need an Access Code?
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 px-2">
                  Get your free access code from our Telegram community
                </p>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={openTelegramGroup}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 h-auto"
                  aria-label="Join OpenStream Telegram community to get access code"
                >
                  <MessageCircle className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  Join Telegram
                </Button>
              </div>
            </section>

            <form 
              onSubmit={handleSubmit} 
              className="space-y-3 sm:space-y-4"
              noValidate
              aria-label="Access code validation form"
            >
              <div className="space-y-2">
                <Label 
                  htmlFor="access-code" 
                  className="text-xs sm:text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 block text-center sm:text-left"
                >
                  Enter Access Code
                </Label>
                <div className="relative">
                  <Input
                    id="access-code"
                    name="accessCode"
                    type="text"
                    placeholder="ABC12345"
                    value={code}
                    onChange={handleInputChange}
                    maxLength={8}
                    minLength={8}
                    className="text-center text-base sm:text-lg md:text-xl font-mono tracking-[0.15em] sm:tracking-[0.2em] h-10 sm:h-12 md:h-14 border-2 focus:border-blue-500 dark:focus:border-blue-400 transition-colors w-full"
                    disabled={isValidating}
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                    aria-describedby={error ? "code-error" : "code-help"}
                    aria-invalid={!!error}
                    required
                  />
                  <div 
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500"
                    aria-label={`${code.length} of 8 characters entered`}
                  >
                    {code.length}/8
                  </div>
                </div>
                {!error && (
                  <div id="code-help" className="sr-only">
                    Enter your 8-character alphanumeric access code
                  </div>
                )}
              </div>

              {error && (
                <Alert 
                  variant="destructive" 
                  className="border-red-200 dark:border-red-800 p-3 sm:p-4"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <AlertDescription className="text-xs sm:text-sm ml-1 sm:ml-0">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-2 sm:pt-3">
                <Button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full h-10 sm:h-11 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg"
                  aria-describedby="submit-help"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" aria-hidden="true" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                      <span>Connect to Server</span>
                    </>
                  )}
                </Button>
                <div id="submit-help" className="sr-only">
                  {isSubmitDisabled ? "Enter a valid 8-character code to enable connection" : "Click to validate your access code and connect"}
                </div>
              </div>
            </form>

            {/* Information Section */}
            <section 
              className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3"
              aria-labelledby="info-heading"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 justify-center">
                <Info className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                <h4 id="info-heading">Important Information</h4>
              </div>
              <ul className="grid gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400" role="list">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" aria-hidden="true"></div>
                  <span className="leading-relaxed">You need to install the app first to connect the server</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" aria-hidden="true"></div>
                  <span className="leading-relaxed">Access codes expire after 10 minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" aria-hidden="true"></div>
                  <span className="leading-relaxed">You need to join Telegram community to get the access code</span>
                </li>
              </ul>
            </section>

            {/* Telegram Group Link */}
            <footer className="text-center pt-1 sm:pt-2">
              <button
                type="button"
                onClick={openTelegramGroup}
                className="text-xs sm:text-sm md:text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Visit OpenStream Telegram community at t.me/openstream3"
              >
                t.me/openstream3
              </button>
            </footer>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})
