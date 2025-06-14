'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Crown,
  Shield,
  Save,
  ArrowLeft,
  Phone,
  ChevronDown,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  userId: string
  firstName: string
  lastName: string
  email: string
  phonePrefix: string
  phoneNumber: string
  role: 'admin' | 'user' | 'customer'
  isVerified: boolean
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export default function AdminProfile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('+33')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const countries = [
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+32', name: 'Belgique', flag: '🇧🇪' },
    { code: '+31', name: 'Pays-Bas', flag: '🇳🇱' },
    { code: '+34', name: 'Espagne', flag: '🇪🇸' },
    { code: '+39', name: 'Italie', flag: '🇮🇹' },
    { code: '+40', name: 'Roumanie', flag: '🇷🇴' },
    { code: '+49', name: 'Allemagne', flag: '🇩🇪' },
    { code: '+41', name: 'Suisse', flag: '🇨🇭' },
    { code: '+351', name: 'Portugal', flag: '🇵🇹' },
    { code: '+44', name: 'Royaume-Uni', flag: '🇬🇧' },
    { code: '+1', name: 'États-Unis', flag: '🇺🇸' },
  ]

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()

      if (data.success && ['admin', 'user', 'customer'].includes(data.user.role)) {
        setUser(data.user)
        setFirstName(data.user.firstName || '')
        setLastName(data.user.lastName || '')
        setEmail(data.user.email)
        setPhonePrefix(data.user.phonePrefix || '+33')
        setPhoneNumber(data.user.phoneNumber || '')
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phonePrefix,
          phoneNumber,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Profil mis à jour avec succès')
        setUser(prev => prev ? { ...prev, firstName, lastName, email, phonePrefix, phoneNumber } : null)
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.message || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Erreur lors de la mise à jour du profil')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Mot de passe modifié avec succès')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.message || 'Erreur lors du changement de mot de passe')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setError('Erreur lors du changement de mot de passe')
    } finally {
      setSaving(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
      case 'user':
        return <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
      default:
        return <User className="h-4 w-4 sm:h-5 sm:w-5" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'user':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur'
      case 'customer':
        return 'Client'
      case 'user':
        return 'Utilisateur'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold mb-2">Erreur de chargement</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Impossible de charger le profil utilisateur
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full h-10 sm:h-12"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <User className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <span className="truncate">Mon Profil</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Gérez vos informations personnelles et paramètres de sécurité
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/admin'}
          className="flex items-center gap-2 w-full sm:w-auto h-10 sm:h-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm sm:text-base">{message}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm sm:text-base">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile Information */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Informations du Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* User Info Display */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-center gap-3 min-w-0">
                                     <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-md text-white">
                     {getRoleIcon(user.role)}
                   </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                        {getRoleDisplayName(user.role)}
                      </Badge>
                      {user.isVerified && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 w-fit">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                      <Badge 
                        variant={user.isActive ? "secondary" : "outline"} 
                        className={`text-xs px-2 py-0.5 h-5 w-fit ${user.isActive ? 'bg-green-100 text-green-800' : 'text-gray-600'}`}
                      >
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-blue-800 font-medium">Membre depuis</p>
                  </div>
                  <p className="text-blue-700 font-semibold">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {user.lastLogin && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-green-800 font-medium">Dernière connexion</p>
                    </div>
                    <p className="text-green-700 font-semibold">
                      {new Date(user.lastLogin).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Update Profile Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">Prénom</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10 h-10 sm:h-auto"
                      placeholder="Jean"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">Nom</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10 h-10 sm:h-auto"
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">Adresse Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 sm:h-auto"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Numéro de téléphone</Label>
                <div className="flex space-x-2 mt-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 border border-input bg-background rounded-md text-sm w-20 sm:w-24 justify-between hover:bg-accent h-10 transition-colors"
                    >
                      <span className="text-xs sm:text-sm">{countries.find(c => c.code === phonePrefix)?.flag || '🇫🇷'}</span>
                      <span className="text-xs hidden sm:inline">{phonePrefix}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-background border border-input rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                        {countries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setPhonePrefix(country.code)
                              setShowCountryDropdown(false)
                            }}
                            className="flex items-center space-x-3 px-3 py-2 text-sm hover:bg-accent w-full text-left transition-colors"
                          >
                            <span>{country.flag}</span>
                            <span className="flex-1">{country.name}</span>
                            <span className="text-muted-foreground">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 h-10 sm:h-auto"
                      placeholder="6 12 34 56 78"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full h-10 sm:h-auto">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Mettre à jour le profil
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
              Changer le Mot de Passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium">Mot de passe actuel</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 sm:h-auto"
                    placeholder="Votre mot de passe actuel"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium">Nouveau mot de passe</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 sm:h-auto"
                    placeholder="Nouveau mot de passe (min. 8 caractères)"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Le mot de passe doit contenir au moins 8 caractères
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le nouveau mot de passe</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 sm:h-auto"
                    placeholder="Confirmez votre nouveau mot de passe"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full h-10 sm:h-auto">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Changer le mot de passe
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 