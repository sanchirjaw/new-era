"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Database, HardDrive, BarChart3, Shield, Archive, Activity, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DatabaseStats {
  collections: number
  totalSize: number
  totalDocuments: number
  storageUsed: number
  storageTotal: number
}

interface Collection {
  name: string
  size: number
  documents: number
  lastUpdated: string
  status: string
}

export default function AdminDatabase() {
  const [stats, setStats] = useState<DatabaseStats>({
    collections: 0,
    totalSize: 0,
    totalDocuments: 0,
    storageUsed: 0,
    storageTotal: 0
  })
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check", {
        credentials: 'include'
      })
      if (!response.ok || response.status === 401) {
        router.push("/admin/login")
        return
      }
      
      const data = await response.json()
      if (data.user.role !== "admin") {
        router.push("/admin/login")
        return
      }
      
      fetchDatabaseStats()
    } catch (error) {

      router.push("/admin/login")
    }
  }

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch("/api/admin/database")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setCollections(data.collections)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch database stats",
          variant: "destructive"
        })
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to fetch database stats",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchDatabaseStats()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStoragePercentage = () => {
    if (stats.storageTotal === 0) return 0
    return Math.round((stats.storageUsed / stats.storageTotal) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Өгөгдлийн сан удирдлага</h1>
        <p className="text-gray-600">MongoDB өгөгдлийн сангийн төлөв, нөөц, аюулгүй байдлын удирдлага</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">MongoDB Collections</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collections}</div>
            <p className="text-xs text-gray-500">collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bunny Videos</CardTitle>
            <HardDrive className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-gray-500">Library: -</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mongo Stats</CardTitle>
            <BarChart3 className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500">Performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Webhook / Errors</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">OK</div>
            <p className="text-xs text-gray-500">Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Хадгалах нөөц</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ашигласан нөөц</span>
              <span className="text-sm text-gray-500">{formatBytes(stats.storageUsed)}</span>
            </div>
            <Progress value={getStoragePercentage()} className="w-full" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{getStoragePercentage()}%</span>
              <span className="text-gray-500">{formatBytes(stats.storageTotal - stats.storageUsed)} үлдсэн</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collections List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Collections</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {collections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No collections found</div>
            ) : (
              collections.map((collection) => (
                <div key={collection.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Database className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{collection.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatBytes(collection.size)} • {collection.documents.toLocaleString()} documents
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(collection.lastUpdated)}</p>
                    </div>
                  </div>
                  <Badge variant={collection.status === "Active" ? "default" : "secondary"}>
                    {collection.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Database Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Backup Database
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Audit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
