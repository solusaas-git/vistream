'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
      // Vérifier la validité du token
      verifyToken(tokenParam)
    } else {
      setMessage('Token de réinitialisation manquant')
      setIsCheckingToken(false)
    }
  }, [searchParams])

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToVerify }),
      })

      if (response.ok) {
        setIsValidToken(true)
      } else {
        const data = await response.json()
        setMessage(data.message || 'Token invalide ou expiré')
      }
    } catch (error) {
      setMessage('Erreur lors de la vérification du token')
    } finally {
      setIsCheckingToken(false)
    }
  }

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8

    return {
      minLength,
      isValid: minLength
    }
  }

  const passwordValidation = validatePassword(password)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordValidation.isValid) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (!passwordsMatch) {
      setMessage('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setMessage('Mot de passe réinitialisé avec succès !')
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push('/auth/login?message=Mot de passe réinitialisé avec succès')
        }, 3000)
      } else {
        setMessage(data.message || 'Erreur lors de la réinitialisation')
      }
    } catch (error) {
      setMessage('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Vérification du token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Token invalide</CardTitle>
            <CardDescription>
              {message || 'Le lien de réinitialisation est invalide ou a expiré'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/auth/forgot-password">
                <Button className="w-full">
                  Demander un nouveau lien
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Succès !</CardTitle>
            <CardDescription>
              Votre mot de passe a été réinitialisé avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-gray-600 mb-4">
              Vous allez être redirigé vers la page de connexion...
            </p>
            <Link href="/auth/login">
              <Button className="w-full">
                Se connecter maintenant
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 backdrop-blur-sm bg-white/95">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Nouveau mot de passe</CardTitle>
          <CardDescription>
            Choisissez un nouveau mot de passe sécurisé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Indicateurs de validation du mot de passe */}
              {password && (
                <div className="space-y-1 text-sm">
                  <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidation.minLength ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    Au moins 8 caractères
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Indicateur de correspondance des mots de passe */}
              {confirmPassword && (
                <div className={`flex items-center gap-2 text-sm ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  Les mots de passe correspondent
                </div>
              )}
            </div>

            {message && (
              <Alert className={isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className={isSuccess ? 'text-green-800' : 'text-red-800'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/login" 
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 backdrop-blur-sm bg-white/95">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  )
} 