"use client"

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FirebasePhoneAuthProps {
  onSuccess: (phone: string) => void
  onError: (error: string) => void
}

export default function FirebasePhoneAuth({ onSuccess, onError }: FirebasePhoneAuthProps) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'phone' | 'otp'>('phone')

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha verified')
        }
      })
    }
  }

  const sendOTP = async () => {
    if (!phone || phone.length !== 10) {
      onError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    try {
      setupRecaptcha()
      const appVerifier = (window as any).recaptchaVerifier
      const phoneNumber = `+91${phone}`
      
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      setConfirmationResult(confirmation)
      setStep('otp')
      console.log('OTP sent successfully')
    } catch (error: any) {
      console.error('Error sending OTP:', error)
      onError(error.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!otp || !confirmationResult) {
      onError('Please enter the OTP')
      return
    }

    setLoading(true)
    try {
      await confirmationResult.confirm(otp)
      onSuccess(phone)
    } catch (error: any) {
      console.error('Error verifying OTP:', error)
      onError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div id="recaptcha-container"></div>
      
      {step === 'phone' ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                +91
              </span>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone number"
                className="rounded-l-none"
                maxLength={10}
              />
            </div>
          </div>
          <Button 
            onClick={sendOTP} 
            disabled={loading || phone.length !== 10}
            className="w-full"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Enter OTP</label>
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
          </div>
          <Button 
            onClick={verifyOTP} 
            disabled={loading || otp.length !== 6}
            className="w-full"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setStep('phone')}
            className="w-full"
          >
            Change Phone Number
          </Button>
        </>
      )}
    </div>
  )
}