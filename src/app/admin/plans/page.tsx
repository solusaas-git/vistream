'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  Crown,
  Shield,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface Plan {
  _id: string
  name: string
  description: string
  price: string
  period: string
  highlight: boolean
  features: string[]
  isActive: boolean
  order: number
  slug: string
  createdAt: string
  updatedAt: string
}

const createPlanSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(50),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères.").max(200),
  price: z.string().min(1, "Le prix est requis."),
  period: z.string().min(1, "La période est requise."),
  highlight: z.boolean(),
  features: z.string().min(10, "Les fonctionnalités sont requises."),
  isActive: z.boolean(),
  order: z.number().min(1, "L'ordre doit être supérieur à 0."),
})

type CreatePlanFormValues = z.infer<typeof createPlanSchema>

// Fonction pour générer un slug côté client (pour prévisualisation)
const generateSlugPreview = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâäãåā]/g, 'a')
    .replace(/[èéêëē]/g, 'e')
    .replace(/[ìíîïī]/g, 'i')
    .replace(/[òóôöõøō]/g, 'o')
    .replace(/[ùúûüū]/g, 'u')
    .replace(/[ñń]/g, 'n')
    .replace(/[çć]/g, 'c')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const form = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      period: 'mois',
      highlight: false,
      features: '',
      isActive: true,
      order: 1,
    },
  })

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/plans')
      const data = await response.json()

      if (data.success) {
        setPlans(data.data.plans || [])
      } else {
        console.error('Error fetching plans:', data.error)
        setMessage({ type: 'error', text: data.error || 'Erreur lors du chargement des plans' })
        setPlans([])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      setMessage({ type: 'error', text: 'Erreur de connexion lors du chargement des plans' })
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleCreatePlan = async (data: CreatePlanFormValues) => {
    try {
      setIsSubmitting(true)
      setMessage(null)
      
      const planData = {
        ...data,
        features: data.features.split('\n').filter(f => f.trim() !== '')
      }

      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      })

      const result = await response.json()

      if (result.success) {
        setIsCreateDialogOpen(false)
        form.reset()
        fetchPlans()
        setMessage({ type: 'success', text: 'Plan créé avec succès!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la création du plan' })
      }
    } catch (error) {
      console.error('Error creating plan:', error)
      setMessage({ type: 'error', text: 'Erreur de connexion lors de la création du plan' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPlan = async (data: CreatePlanFormValues) => {
    if (!selectedPlan) return

    try {
      setIsSubmitting(true)
      setMessage(null)
      
      const planData = {
        ...data,
        features: data.features.split('\n').filter(f => f.trim() !== '')
      }

      const response = await fetch(`/api/admin/plans/${selectedPlan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      })

      const result = await response.json()

      if (result.success) {
        setIsEditDialogOpen(false)
        setSelectedPlan(null)
        form.reset()
        fetchPlans()
        setMessage({ type: 'success', text: 'Plan modifié avec succès!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la modification du plan' })
      }
    } catch (error) {
      console.error('Error editing plan:', error)
      setMessage({ type: 'error', text: 'Erreur de connexion lors de la modification du plan' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
      return
    }

    try {
      setMessage(null)
      
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        fetchPlans()
        setMessage({ type: 'success', text: 'Plan supprimé avec succès!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la suppression du plan' })
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      setMessage({ type: 'error', text: 'Erreur de connexion lors de la suppression du plan' })
    }
  }

  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan)
    form.reset({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      period: plan.period,
      highlight: plan.highlight,
      features: plan.features.join('\n'),
      isActive: plan.isActive,
      order: plan.order,
    })
    setIsEditDialogOpen(true)
  }

  const getPlanIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('pro') || lowerName.includes('enterprise')) {
      return <Crown className="h-4 w-4" />
    } else if (lowerName.includes('standard') || lowerName.includes('business')) {
      return <Shield className="h-4 w-4" />
    } else {
      return <User className="h-4 w-4" />
    }
  }

  const getPlanBadgeColor = (name: string, highlight: boolean) => {
    if (highlight) {
      return 'bg-purple-100 text-purple-800'
    }
    const lowerName = name.toLowerCase()
    if (lowerName.includes('pro') || lowerName.includes('enterprise')) {
      return 'bg-purple-100 text-purple-800'
    } else if (lowerName.includes('standard') || lowerName.includes('business')) {
      return 'bg-blue-100 text-blue-800'
    } else {
      return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Gestion des Plans
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les plans tarifaires affichés sur la page d'accueil
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Créer un Nouveau Plan
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreatePlan)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du plan</FormLabel>
                        <FormControl>
                          <Input placeholder="Starter" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordre d'affichage</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Slug Preview */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Slug (généré automatiquement)
                  </Label>
                  <Input 
                    value={form.watch('name') ? generateSlugPreview(form.watch('name')) : ''}
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                    placeholder="Le slug sera généré automatiquement..."
                  />
                  <p className="text-xs text-muted-foreground">
                    URL finale: /auth/signup?plan={form.watch('name') ? generateSlugPreview(form.watch('name')) : 'slug-du-plan'}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Pour débuter avec le streaming IA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix</FormLabel>
                        <FormControl>
                          <Input placeholder="15€" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Période</FormLabel>
                        <FormControl>
                          <Input placeholder="mois" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonctionnalités (une par ligne)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="500 Go bande passante&#10;1 To stockage&#10;Live 1080p&#10;Analytics de base&#10;Support email"
                          rows={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-6">
                  <FormField
                    control={form.control}
                    name="highlight"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Plan mis en avant
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Plan actif
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
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
                      'Créer le plan'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Plans Tarifaires ({plans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Fonctionnalités</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun plan trouvé. Créez votre premier plan tarifaire.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Badge className={getPlanBadgeColor(plan.name, plan.highlight)}>
                            <div className="flex items-center gap-1">
                              {getPlanIcon(plan.name)}
                              {plan.name}
                              {plan.highlight && <Star className="h-3 w-3 ml-1" />}
                            </div>
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {plan.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{plan.slug}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{plan.price}</div>
                        <div className="text-sm text-muted-foreground">/{plan.period}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {plan.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {plan.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.order}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {plan.features.slice(0, 2).map((feature, index) => (
                            <div key={index}>• {feature}</div>
                          ))}
                          {plan.features.length > 2 && (
                            <div className="text-muted-foreground">
                              +{plan.features.length - 2} autres...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPlan(plan)
                              setIsDetailDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePlan(plan._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifier le Plan
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditPlan)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du plan</FormLabel>
                      <FormControl>
                        <Input placeholder="Starter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre d'affichage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Slug Display for Edit */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Slug actuel
                </Label>
                <Input 
                  value={selectedPlan?.slug || ''}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    URL actuelle: /auth/signup?plan={selectedPlan?.slug || 'slug-du-plan'}
                  </p>
                  {form.watch('name') && form.watch('name') !== selectedPlan?.name && (
                    <p className="text-xs text-amber-600">
                      Nouveau slug: {generateSlugPreview(form.watch('name'))}
                    </p>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Pour débuter avec le streaming IA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix</FormLabel>
                      <FormControl>
                        <Input placeholder="15€" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Période</FormLabel>
                      <FormControl>
                        <Input placeholder="mois" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonctionnalités (une par ligne)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="500 Go bande passante&#10;1 To stockage&#10;Live 1080p&#10;Analytics de base&#10;Support email"
                        rows={6}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-6">
                <FormField
                  control={form.control}
                  name="highlight"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Plan mis en avant
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Plan actif
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
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
                    'Modifier le plan'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Plan Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails du Plan
            </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
                  <p className="text-sm">{selectedPlan.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Prix</Label>
                  <p className="text-sm">{selectedPlan.price}/{selectedPlan.period}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedPlan.description}</p>
              </div>

              {/* Slug Display */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Slug</Label>
                <div className="mt-1 space-y-1">
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{selectedPlan.slug}</p>
                  <p className="text-xs text-muted-foreground">
                    URL: /auth/signup?plan={selectedPlan.slug}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                  <div className="flex items-center gap-1 mt-1">
                    {selectedPlan.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {selectedPlan.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ordre</Label>
                  <p className="text-sm">{selectedPlan.order}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Mis en avant</Label>
                <div className="flex items-center gap-1 mt-1">
                  {selectedPlan.highlight ? (
                    <Star className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">
                    {selectedPlan.highlight ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Fonctionnalités</Label>
                <ul className="text-sm mt-2 space-y-1">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Créé le</Label>
                  <p className="text-sm">{new Date(selectedPlan.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Modifié le</Label>
                  <p className="text-sm">{new Date(selectedPlan.updatedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 