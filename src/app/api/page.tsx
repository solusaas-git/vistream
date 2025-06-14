import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Code, Key, Zap, Upload, Play, BarChart3, Shield } from 'lucide-react'
import Link from 'next/link'

export default function ApiPage() {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/videos/upload',
      description: 'Upload une nouvelle vidéo',
      category: 'Videos',
      auth: true
    },
    {
      method: 'GET',
      path: '/api/v1/videos/{id}',
      description: 'Récupère les détails d\'une vidéo',
      category: 'Videos',
      auth: true
    },
    {
      method: 'POST',
      path: '/api/v1/live/streams',
      description: 'Crée un nouveau stream live',
      category: 'Live',
      auth: true
    },
    {
      method: 'GET',
      path: '/api/v1/analytics/videos/{id}',
      description: 'Analytics d\'une vidéo spécifique',
      category: 'Analytics',
      auth: true
    },
    {
      method: 'POST',
      path: '/api/v1/ai/upscale',
      description: 'Lance l\'upscaling IA d\'une vidéo',
      category: 'AI',
      auth: true
    }
  ]

  const categories = [
    { id: 'videos', name: 'Videos', icon: <Upload className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
    { id: 'live', name: 'Live', icon: <Play className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
    { id: 'ai', name: 'AI', icon: <Zap className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
    { id: 'auth', name: 'Auth', icon: <Shield className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' }
  ]

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-background py-16 pt-32">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-12">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">API Reference</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Documentation complète de l'API REST Vistream pour intégrer nos services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-4">
                <Code className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Base URL</h3>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                https://api.vistream.net
              </code>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-4">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Authentification</h3>
              <p className="text-sm text-muted-foreground">Bearer Token (API Key)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Rate Limit</h3>
              <p className="text-sm text-muted-foreground">1000 req/min</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-blue-50 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Documentation API Complète</h3>
            <p className="text-muted-foreground mb-6">
              Accédez à la documentation interactive avec tous les endpoints, exemples et SDKs.
            </p>
            <Button>Voir la Documentation Complète</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 