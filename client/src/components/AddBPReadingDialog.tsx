import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Plus, Loader2 } from 'lucide-react'
import { getCurrentDatetimeLocal, datetimeLocalToISO } from '@/utils/timeUtils'
import { type CreateBPReadingData } from '@/services/bpReadingService'

interface AddBPReadingDialogProps {
  onAdd: (reading: CreateBPReadingData) => void | Promise<void>
  children?: React.ReactNode
  buttonSize?: 'default' | 'sm' | 'lg'
  buttonText?: string
  showLoadingState?: boolean
}

export function AddBPReadingDialog({ 
  onAdd,
  children,
  buttonSize = 'default',
  buttonText = 'Add Reading',
  showLoadingState = true
}: AddBPReadingDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    pulseRate: '',
    timestamp: getCurrentDatetimeLocal(),
    comments: '',
    location: '',
    deviceUsed: '',
    tags: []
  })
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: string[] = []
    
    const systolic = parseInt(formData.systolic)
    const diastolic = parseInt(formData.diastolic)
    
    if (!systolic || systolic < 70 || systolic > 250) {
      newErrors.push('Systolic pressure must be between 70-250 mmHg')
    }
    
    if (!diastolic || diastolic < 40 || diastolic > 150) {
      newErrors.push('Diastolic pressure must be between 40-150 mmHg')
    }
    
    if (systolic && diastolic && systolic <= diastolic) {
      newErrors.push('Systolic pressure must be higher than diastolic pressure')
    }
    
    if (formData.pulseRate && (parseInt(formData.pulseRate) < 30 || parseInt(formData.pulseRate) > 200)) {
      newErrors.push('Pulse rate must be between 30-200 bpm')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const resetForm = () => {
    setFormData({
      systolic: '',
      diastolic: '',
      pulseRate: '',
      timestamp: getCurrentDatetimeLocal(),
      comments: '',
      location: '',
      deviceUsed: '',
      tags: []
    })
    setErrors([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (showLoadingState) {
      setSubmitting(true)
    }
    
    try {
      const readingData: CreateBPReadingData = {
        systolic: parseInt(formData.systolic),
        diastolic: parseInt(formData.diastolic),
        pulseRate: formData.pulseRate ? parseInt(formData.pulseRate) : undefined,
        timestamp: datetimeLocalToISO(formData.timestamp),
        comments: formData.comments || undefined,
        location: formData.location || undefined,
        deviceUsed: formData.deviceUsed || undefined,
        tags: formData.tags || []
      }
      
      await onAdd(readingData)
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error adding reading:', error)
      setErrors(['Failed to add reading. Please try again.'])
    } finally {
      if (showLoadingState) {
        setSubmitting(false)
      }
    }
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size={buttonSize} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Blood Pressure Reading</DialogTitle>
          <DialogDescription>
            Enter your blood pressure measurements and additional details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="systolic" className="text-sm font-medium cursor-pointer">
                Systolic (mmHg)
              </label>
              <Input
                id="systolic"
                type="number"
                min="70"
                max="250"
                placeholder="120"
                value={formData.systolic}
                onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="diastolic" className="text-sm font-medium cursor-pointer">
                Diastolic (mmHg)
              </label>
              <Input
                id="diastolic"
                type="number"
                min="40"
                max="150"
                placeholder="80"
                value={formData.diastolic}
                onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="pulseRate" className="text-sm font-medium cursor-pointer">
              Pulse Rate (bpm) - Optional
            </label>
            <Input
              id="pulseRate"
              type="number"
              min="30"
              max="200"
              placeholder="72"
              value={formData.pulseRate}
              onChange={(e) => setFormData({ ...formData, pulseRate: e.target.value })}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timestamp" className="text-sm font-medium cursor-pointer">
              Date & Time
            </label>
            <Input
              id="timestamp"
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="comments" className="text-sm font-medium cursor-pointer">
              Comments - Optional
            </label>
            <Input
              id="comments"
              placeholder="e.g., after exercise, morning reading..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              disabled={submitting}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 cursor-pointer" 
              disabled={submitting}
            >
              {showLoadingState && submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Reading'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}