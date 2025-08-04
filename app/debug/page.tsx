"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/providers"

export default function DebugPage() {
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { user, token } = useAuth()

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test")
      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      setDbStatus({ error: "Failed to connect" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Dashboard</h1>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="api">API Status</TabsTrigger>
            <TabsTrigger value="env">Environment</TabsTrigger>
          </TabsList>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Database Connection
                  <Button onClick={testConnection} disabled={loading}>
                    {loading ? "Testing..." : "Test Connection"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dbStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={dbStatus.connected ? "default" : "destructive"}>
                        {dbStatus.connected ? "Connected" : "Disconnected"}
                      </Badge>
                      {dbStatus.database && <span>Database: {dbStatus.database}</span>}
                    </div>

                    {dbStatus.collections && (
                      <div>
                        <h3 className="font-semibold mb-2">Collections:</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {dbStatus.collections.map((collection: any) => (
                            <div key={collection.name} className="p-2 bg-gray-100 rounded">
                              <span className="font-medium">{collection.name}</span>
                              <span className="text-sm text-gray-600 ml-2">({collection.count} documents)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Loading...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={user ? "default" : "secondary"}>
                      {user ? "Authenticated" : "Not Authenticated"}
                    </Badge>
                  </div>

                  {user && (
                    <div className="space-y-2">
                      <p>
                        <strong>User ID:</strong> {user.id}
                      </p>
                      <p>
                        <strong>Phone:</strong> {user.phone}
                      </p>
                      <p>
                        <strong>Name:</strong> {user.name || "Not set"}
                      </p>
                      <p>
                        <strong>Role:</strong> {user.role}
                      </p>
                      <p>
                        <strong>Verified:</strong> {user.isVerified ? "Yes" : "No"}
                      </p>
                    </div>
                  )}

                  {token && (
                    <div>
                      <p>
                        <strong>Token:</strong>
                      </p>
                      <code className="text-xs bg-gray-100 p-2 rounded block mt-1 break-all">
                        {token.substring(0, 50)}...
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>/api/test</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>/api/auth/send-otp</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>/api/auth/verify-otp</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>/api/products</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="env">
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>MONGODB_URI</span>
                    <Badge variant={process.env.MONGODB_URI ? "default" : "destructive"}>
                      {process.env.MONGODB_URI ? "Set" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>JWT_SECRET</span>
                    <Badge variant={process.env.JWT_SECRET ? "default" : "destructive"}>
                      {process.env.JWT_SECRET ? "Set" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</span>
                    <Badge variant={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? "default" : "destructive"}>
                      {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? "Set" : "Missing"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
