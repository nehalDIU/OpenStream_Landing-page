"use client"

import { useState, useCallback, useMemo, memo } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, MessageCircle, X } from "lucide-react"
import { toast } from "sonner"

interface AccessCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const AccessCodeDialog = memo(function AccessCodeDialog({ open, onOpenChange, onSuccess }: AccessCodeDialogProps) {
  const [code, setCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")

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

      const data = await response.json()

      if (response.ok && data.valid) {
        toast.success("Access code validated successfully!", {
          description: "Connecting to premium servers..."
        })
        onSuccess()
        onOpenChange(false)
        setCode("")
        setError("")
      } else {
        // Handle both 400 responses and successful responses with valid: false
        const errorMessage = data.error || data.message || "Invalid access code"
        setError(errorMessage)

        // Show specific toast messages based on error type
        if (errorMessage.toLowerCase().includes('already used')) {
          toast.error("Access Code Already Used", {
            description: "This access code has been used before. Please get a new code from Telegram."
          })
        } else if (errorMessage.toLowerCase().includes('expired')) {
          toast.error("Access Code Expired", {
            description: "This access code has expired. Please get a new code from Telegram."
          })
        } else {
          toast.error(errorMessage, {
            description: "Please check your code and try again"
          })
        }
      }
    } catch (error) {
      console.error('Validation error:', error)
      const errorMessage = "Connection failed. Please check your internet connection and try again."
      setError(errorMessage)
      toast.error("Connection Error", {
        description: errorMessage
      })
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
    window.open("https://t.me/openstream3", "_blank", "noopener,noreferrer")
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Connect Server
          </DialogTitle>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Enter your access code to connect to premium servers
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openTelegramGroup}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/20"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Get Access Code
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="access-code"
                name="accessCode"
                type="text"
                placeholder="Enter 8-character code"
                value={code}
                onChange={handleInputChange}
                maxLength={8}
                minLength={8}
                className="text-center text-lg font-mono tracking-wider h-12 border-2 focus:border-blue-500 dark:focus:border-blue-400 transition-colors w-full"
                disabled={isValidating}
                autoFocus
                autoComplete="off"
                spellCheck="false"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {code.length}/8
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="p-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect to Server'
            )}
          </Button>
        </form>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Access codes expire after Use
            </p>
            <button
              type="button"
              onClick={openTelegramGroup}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
            >
              t.me/openstream3
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
