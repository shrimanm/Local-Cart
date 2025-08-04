"use client"

import { useEffect } from "react"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import OnboardingForm from "@/components/auth/onboarding-form"

export default function OnboardingPage() {
  const { user, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || !token) {
      router.push("/")
      return
    }

    // If user already has profile data, redirect to home
    if (user.name) {
      router.push("/home")
      return
    }
  }, [user, token, router])

  if (!user) return null

  return <OnboardingForm />
}