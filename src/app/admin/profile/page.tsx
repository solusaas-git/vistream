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
  ChevronDown
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
        return <Crown className="h-4 w-4" />
      case 'user':
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Impossible de charger le profil utilisateur</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            Mon Profil
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos informations personnelles et paramètres de sécurité
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/admin'}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations du Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info Display */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                                     <div>
                     <p className="font-medium">{user.firstName} {user.lastName}</p>
                     <p className="text-sm text-muted-foreground">{user.email}</p>
                     <div className="flex items-center gap-2 mt-1">
                       <Badge variant={getRoleBadgeVariant(user.role)}>
                         {user.role === 'admin' ? 'Administrateur' : user.role}
                       </Badge>
                       {user.isVerified && (
                         <Badge variant="secondary" className="text-xs">
                           Vérifié
                         </Badge>
                       )}
                     </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Membre depuis</p>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <p className="font-medium">
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Update Profile Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10"
                      placeholder="Jean"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10"
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="email">Adresse Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Numéro de téléphone</Label>
                <div className="flex space-x-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center space-x-2 px-3 py-2 border border-input bg-background rounded-md text-sm w-24 justify-between hover:bg-accent h-10"
                    >
                      <span>{countries.find(c => c.code === phonePrefix)?.flag || '🇫🇷'}</span>
                      <span className="text-xs">{phonePrefix}</span>
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
                            className="flex items-center space-x-3 px-3 py-2 text-sm hover:bg-accent w-full text-left"
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
                      className="pl-10"
                      placeholder="6 12 34 56 78"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Mise à jour...' : 'Mettre à jour le profil'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Changer le Mot de Passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                {saving ? 'Modification...' : 'Changer le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 