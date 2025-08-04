"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"
import { User, Mail, Calendar, Users, MapPin, Heart, Bell, ArrowLeft } from "lucide-react"
import { useBackButton } from "@/hooks/useBackButton"

const interests = [
  "Men's Fashion",
  "Women's Fashion",
  "Kids Fashion",
  "Footwear",
  "Accessories",
  "Beauty",
  "Home & Living",
  "Sports",
  "Electronics",
  "Books",
]



export default function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
    city: "",
    interests: [] as string[],
    notifications: {
      email: true,
      sms: false,
      push: true,
      offers: true,
    },
  })
  const [availableTowns, setAvailableTowns] = useState<string[]>([])
  const [townsLoading, setTownsLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { token, user, login, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchTowns()
  }, [])

  const fetchTowns = async () => {
    try {
      const response = await fetch('/api/admin/towns')
      const data = await response.json()
      
      if (response.ok) {
        const townNames = data.towns.map((town: any) => town.name)
        setAvailableTowns(townNames)
      }
    } catch (error) {
      console.error('Error fetching towns:', error)
    } finally {
      setTownsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    logout()
    router.push("/")
  }

  // Handle back button behavior
  const handleCustomBack = () => {
    if (step > 1) {
      handleBack()
    } else {
      handleBackToLogin()
    }
  }

  const { goBack } = useBackButton({
    onBack: handleCustomBack,
    preventExit: true
  })

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleNotificationChange = (type: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: value,
      },
    }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.age || !formData.gender || !formData.city) {
        setError("Please fill in all required fields")
        return
      }
    }
    setError("")
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || null,
          age: Number.parseInt(formData.age),
          gender: formData.gender,
          city: formData.city,
          interests: formData.interests,
          notifications: formData.notifications,
        }),
      })

      const data = await response.json()
      console.log('Profile update response:', { status: response.status, data })

      if (response.ok) {
        login(token!, data.user)
        router.push("/home")
      } else {
        console.error('Profile update failed:', data)
        setError(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <User className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email (Optional)
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Age *
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="13"
              max="100"
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gender *
            </Label>
            <Select onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            City *
          </Label>
          <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder={townsLoading ? "Loading cities..." : "Select your city"} />
            </SelectTrigger>
            <SelectContent>
              {availableTowns.map((town) => (
                <SelectItem key={town} value={town}>
                  {town}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Heart className="h-8 w-8 text-pink-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Your Interests</h3>
        <p className="text-gray-600">Help us personalize your experience</p>
      </div>

      <div className="space-y-4">
        <Label>What are you interested in? (Select multiple)</Label>
        <div className="grid grid-cols-2 gap-3">
          {interests.map((interest) => (
            <div
              key={interest}
              onClick={() => handleInterestToggle(interest)}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                formData.interests.includes(interest)
                  ? "border-gray-900 bg-gray-100 text-gray-900"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{interest}</span>
                {formData.interests.includes(interest) && (
                  <Badge variant="secondary" className="bg-gray-900 text-white">
                    ✓
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Bell className="h-8 w-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Notification Preferences</h3>
        <p className="text-gray-600">Choose how you'd like to hear from us</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Order updates and account info</p>
            </div>
            <Checkbox
              checked={formData.notifications.email}
              onCheckedChange={(checked) => handleNotificationChange("email", checked as boolean)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
            <div>
              <h4 className="font-medium text-gray-900">SMS Notifications</h4>
              <p className="text-sm text-gray-600">Important order updates</p>
            </div>
            <Checkbox
              checked={formData.notifications.sms}
              onCheckedChange={(checked) => handleNotificationChange("sms", checked as boolean)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
            <div>
              <h4 className="font-medium text-gray-900">Push Notifications</h4>
              <p className="text-sm text-gray-600">App notifications</p>
            </div>
            <Checkbox
              checked={formData.notifications.push}
              onCheckedChange={(checked) => handleNotificationChange("push", checked as boolean)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
            <div>
              <h4 className="font-medium text-gray-900">Offers & Promotions</h4>
              <p className="text-sm text-gray-600">Deals and special offers</p>
            </div>
            <Checkbox
              checked={formData.notifications.offers}
              onCheckedChange={(checked) => handleNotificationChange("offers", checked as boolean)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        {/* Top Back Button - Go to Login */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToLogin}
          className="mb-4 p-2 hover:bg-gray-100 text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
        
        <Card className="w-full bg-white rounded-2xl shadow-xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Complete Your Profile</CardTitle>
          <CardDescription className="text-gray-600">Step {step} of 3 - Let's personalize your LocalCart experience</CardDescription>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div
              className="bg-gradient-to-r from-gray-900 to-gray-700 h-3 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={
              step === 3
                ? handleSubmit
                : (e) => {
                    e.preventDefault()
                    handleNext()
                  }
            }
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} className="px-6 border-2 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-xl">
                  Back
                </Button>
              )}

              <Button
                type="submit"
                disabled={loading}
                className={`bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${step === 1 ? "ml-auto" : ""}`}
              >
                {loading ? "Saving..." : step === 3 ? "Complete Profile" : "Next"}
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
