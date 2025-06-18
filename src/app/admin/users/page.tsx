'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoleGuard, useUserRole } from '@/components/ui/role-guard'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  UserPlus,
  Shield,
  User,
  Crown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  Hash
} from 'lucide-react'

interface Subscription {
  _id: string
  planId: string
  planName: string
  planPrice: string
  planPeriod: string
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  startDate: string
  endDate?: string
  autoRenew: boolean
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  phonePrefix: string
  phoneNumber: string
  role: 'admin' | 'user' | 'customer'
  isVerified: boolean
  isActive: boolean
  affiliationCode?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
  subscription?: Subscription | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const createUserSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères.").max(50),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(50),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  phonePrefix: z.string().regex(/^\+\d{1,4}$/, "Préfixe téléphonique invalide."),
  phoneNumber: z.string().min(8, "Le numéro doit contenir au moins 8 chiffres.").max(15).regex(/^\d+$/, "Le numéro ne doit contenir que des chiffres."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  role: z.enum(['admin', 'user', 'customer']),
  isVerified: z.boolean(),
  isActive: z.boolean(),
})

const editUserSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères.").max(50),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(50),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  phonePrefix: z.string().regex(/^\+\d{1,4}$/, "Préfixe téléphonique invalide."),
  phoneNumber: z.string().min(8, "Le numéro doit contenir au moins 8 chiffres.").max(15).regex(/^\d+$/, "Le numéro ne doit contenir que des chiffres."),
  password: z.union([
    z.string().length(0),
    z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  ]),
  role: z.enum(['admin', 'user', 'customer']),
  isVerified: z.boolean(),
  isActive: z.boolean(),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>
type EditUserFormValues = z.infer<typeof editUserSchema>

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: currentUser, isAdmin } = useUserRole()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'users')
  const [users, setUsers] = useState<User[]>([])
  const [customers, setCustomers] = useState<User[]>([])
  const [admins, setAdmins] = useState<User[]>([])
  const [usersPagination, setUsersPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [customersPagination, setCustomersPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [adminsPagination, setAdminsPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phonePrefix: '+33',
      phoneNumber: '',
      password: '',
      role: 'customer',
      isVerified: false,
      isActive: true,
    },
  })

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
  })

  // Map tab values to API role values
  const getApiRole = (tabValue: string): string => {
    switch (tabValue) {
      case 'users':
        return 'user'
      case 'customers':
        return 'customer'
      case 'admins':
        return 'admin'
      default:
        return tabValue
    }
  }

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const fetchUsers = useCallback(async (tabValue: string, page: number = 1) => {
    try {
      setLoading(true)
      const apiRole = getApiRole(tabValue)
      const params = new URLSearchParams({
        role: apiRole,
        page: page.toString(),
        limit: '10'
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success) {
        const { users, pagination } = data.data
        
        if (tabValue === 'admins') {
          setAdmins(users)
          setAdminsPagination(pagination)
        } else if (tabValue === 'users') {
          setUsers(users)
          setUsersPagination(pagination)
        } else if (tabValue === 'customers') {
          setCustomers(users)
          setCustomersPagination(pagination)
        }
      } else {
        console.error('Erreur lors du chargement des utilisateurs:', data.error)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      console.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  // Fetch counts for all tabs on initial load
  const fetchAllCounts = useCallback(async () => {
    try {
      const [usersResponse, customersResponse, adminsResponse] = await Promise.all([
        fetch('/api/admin/users?page=1&limit=1&role=user'),
        fetch('/api/admin/users?page=1&limit=1&role=customer'),
        fetch('/api/admin/users?page=1&limit=1&role=admin')
      ])

      const [usersData, customersData, adminsData] = await Promise.all([
        usersResponse.json(),
        customersResponse.json(),
        adminsResponse.json()
      ])

      if (usersData.success) {
        setUsersPagination(prev => ({ ...prev, total: usersData.data.pagination.total }))
      }
      if (customersData.success) {
        setCustomersPagination(prev => ({ ...prev, total: customersData.data.pagination.total }))
      }
      if (adminsData.success) {
        setAdminsPagination(prev => ({ ...prev, total: adminsData.data.pagination.total }))
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }, [])

  useEffect(() => {
    // Fetch counts for all tabs on initial load
    fetchAllCounts()
    
    // Fetch data for the active tab
    fetchUsers(activeTab)
  }, [activeTab, searchTerm, fetchAllCounts, fetchUsers])

  const handleCreateUser = async (data: CreateUserFormValues) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setIsCreateDialogOpen(false)
        form.reset()
        // Refresh counts for all tabs
        fetchAllCounts()
        // Refresh the appropriate tab
        if (data.role === 'user') {
          fetchUsers(activeTab, usersPagination.page)
        } else if (data.role === 'customer') {
          fetchUsers(activeTab, customersPagination.page)
        } else {
          fetchUsers(activeTab, adminsPagination.page)
        }
        alert('Utilisateur créé avec succès!')
      } else {
        alert(result.error || 'Erreur lors de la création de l\'utilisateur')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Erreur lors de la création de l\'utilisateur')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = async (data: EditUserFormValues) => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      
      // Filter out empty password
      const { password, ...updateData } = data
      const finalUpdateData = password && password.trim() !== '' 
        ? { ...updateData, password } 
        : updateData
      
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalUpdateData),
      })

      const result = await response.json()

      if (result.success) {
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        // Refresh counts for all tabs
        fetchAllCounts()
        // Refresh the appropriate tab
        fetchUsers(activeTab, usersPagination.page)
        alert('Utilisateur modifié avec succès!')
      } else {
        alert(result.error || 'Erreur lors de la modification de l\'utilisateur')
      }
    } catch (error) {
      console.error('Error editing user:', error)
      alert('Erreur lors de la modification de l\'utilisateur')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Refresh counts for all tabs
        fetchAllCounts()
        // Refresh the appropriate tab
        fetchUsers(activeTab, usersPagination.page)
        alert('Utilisateur supprimé avec succès!')
      } else {
        alert(result.error || 'Erreur lors de la suppression de l\'utilisateur')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Erreur lors de la suppression de l\'utilisateur')
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phonePrefix: user.phonePrefix,
      phoneNumber: user.phoneNumber,
      password: '', // Don't pre-fill password
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      case 'customer':
        return <Users className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'user':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'customer':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('premium') || planName.toLowerCase().includes('pro')) {
      return <Crown className="h-4 w-4" />
    }
    return <CreditCard className="h-4 w-4" />
  }

  const getSubscriptionBadge = (subscription: Subscription | null) => {
    if (!subscription) {
      return (
        <Badge variant="outline" className="bg-gray-50">
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Aucun abonnement
          </div>
        </Badge>
      )
    }

    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800'
    }

    return (
      <Badge className={statusColors[subscription.status] || statusColors.inactive}>
        <div className="flex items-center gap-1">
          {getPlanIcon(subscription.planName)}
          {subscription.planName}
        </div>
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderUserTable = (userList: User[], pagination: PaginationInfo, role: 'user' | 'customer' | 'admin') => (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Email</TableHead>
            {role === 'user' && <TableHead>Code Affiliation</TableHead>}
            <TableHead>Rôle</TableHead>
            <TableHead>Abonnement</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.map((user) => (
            <TableRow key={user._id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.phonePrefix} {user.phoneNumber}
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              {role === 'user' && (
                <TableCell>
                  {user.affiliationCode ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      <Hash className="h-3 w-3 mr-1" />
                      {user.affiliationCode}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Aucun</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <Badge className={getRoleBadgeColor(user.role)}>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(user.role)}
                    {user.role}
                  </div>
                </Badge>
              </TableCell>
              <TableCell>
                {getSubscriptionBadge(user.subscription || null)}
                {user.subscription && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {user.subscription.planPrice}/{user.subscription.planPeriod}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    {user.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {user.isVerified ? (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="text-sm">
                      {user.isVerified ? 'Vérifié' : 'Non vérifié'}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user)
                      setIsDetailDialogOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
          {pagination.total} {role === 'user' ? 'utilisateurs' : role === 'customer' ? 'clients' : 'administrateurs'}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(activeTab, pagination.page - 1)}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(activeTab, pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <RoleGuard allowedRoles={['admin', 'user']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdmin ? 'Gestion des utilisateurs' : 'Mes clients'}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Gérez les comptes utilisateurs et clients avec leurs abonnements'
                : 'Consultez vos clients affiliés et leurs abonnements'
              }
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                              <Input placeholder="Jean" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <Input placeholder="Dupont" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jean.dupont@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="phonePrefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Préfixe</FormLabel>
                            <FormControl>
                              <Input placeholder="+33" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de téléphone</FormLabel>
                              <FormControl>
                                <Input placeholder="612345678" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rôle</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un rôle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="customer">Client</SelectItem>
                              <SelectItem value="user">Utilisateur</SelectItem>
                              <SelectItem value="admin">Administrateur</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isVerified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Compte vérifié</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                L'email est vérifié
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Compte actif</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                L'utilisateur peut se connecter
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Création...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Créer l'utilisateur
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="true">Actif</SelectItem>
                  <SelectItem value="false">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Users, Customers, and Admins */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Utilisateurs ({usersPagination.total})
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients ({customersPagination.total})
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Administrateurs ({adminsPagination.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>
                  Utilisateurs avec codes d'affiliation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  renderUserTable(users, usersPagination, 'user')
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>
                  Clients et abonnements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  renderUserTable(customers, customersPagination, 'customer')
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>
                  Administrateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  renderUserTable(admins, adminsPagination, 'admin')
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l'utilisateur</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nom complet</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedUser.phonePrefix} {selectedUser.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Rôle</Label>
                    <div className="mt-1">
                      <Badge className={getRoleBadgeColor(selectedUser.role)}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(selectedUser.role)}
                          {selectedUser.role}
                        </div>
                      </Badge>
                    </div>
                  </div>
                  {selectedUser.role === 'user' && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Code d'affiliation</Label>
                      <div className="mt-1">
                        {selectedUser.affiliationCode ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Hash className="h-3 w-3 mr-1" />
                            {selectedUser.affiliationCode}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Aucun code généré</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Statut du compte</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedUser.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {selectedUser.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Vérification</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedUser.isVerified ? (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm">
                        {selectedUser.isVerified ? 'Vérifié' : 'Non vérifié'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                {selectedUser.subscription && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Abonnement</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Plan</Label>
                        <div className="mt-1">
                          {getSubscriptionBadge(selectedUser.subscription)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Prix</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedUser.subscription.planPrice}/{selectedUser.subscription.planPeriod}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Date de début</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDate(selectedUser.subscription.startDate)}
                        </p>
                      </div>
                      {selectedUser.subscription.endDate && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Date de fin</Label>
                          <p className="text-sm text-gray-900 mt-1">
                            {formatDate(selectedUser.subscription.endDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Créé le</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Modifié le</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(selectedUser.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Dupont" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jean.dupont@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={editForm.control}
                      name="phonePrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Préfixe</FormLabel>
                          <FormControl>
                            <Input placeholder="+33" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="col-span-2">
                      <FormField
                        control={editForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro de téléphone</FormLabel>
                            <FormControl>
                              <Input placeholder="612345678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {selectedUser.role === 'user' && selectedUser.affiliationCode && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-blue-800">Code d'affiliation</Label>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">
                          <Hash className="h-3 w-3 mr-1" />
                          {selectedUser.affiliationCode}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Le code d'affiliation est généré automatiquement et ne peut pas être modifié
                      </p>
                    </div>
                  )}

                  <FormField
                    control={editForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe (optionnel)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Laisser vide pour ne pas changer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rôle</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="customer">Client</SelectItem>
                            <SelectItem value="user">Utilisateur</SelectItem>
                            <SelectItem value="admin">Administrateur</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="isVerified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Compte vérifié</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              L'email est vérifié
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Compte actif</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              L'utilisateur peut se connecter
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Modification...
                        </>
                      ) : (
                        <>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier l'utilisateur
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
} 