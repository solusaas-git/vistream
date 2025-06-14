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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { 
  Settings, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Server,
  Play,
  AlertTriangle,
  Check,
  Power,
  PowerOff
} from 'lucide-react'

interface SmtpSettings {
  _id: string
  name: string
  host: string
  port: number
  secure: boolean
  username: string
  fromEmail: string
  fromName: string
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
  password: string
}

const smtpSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  host: z.string().min(1, "L'hôte est requis"),
  port: z.number().min(1, "Le port doit être supérieur à 0").max(65535, "Le port ne peut pas dépasser 65535"),
  secure: z.boolean(),
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  fromEmail: z.string().email("Veuillez entrer une adresse email valide"),
  fromName: z.string().min(1, "Le nom d'expéditeur est requis").max(100, "Le nom d'expéditeur ne peut pas dépasser 100 caractères"),
})

type SmtpFormValues = z.infer<typeof smtpSchema>

export default function AdminSettingsPage() {
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SmtpSettings | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('')
  
  // Modal states
  const [successModal, setSuccessModal] = useState({ open: false, title: '', message: '' })
  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' })
  const [confirmModal, setConfirmModal] = useState({ 
    open: false, 
    title: '', 
    message: '', 
    onConfirm: null as (() => void) | null
  })

  const form = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      name: '',
      host: '',
      port: 587,
      secure: true,
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
    },
  })

  const editForm = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpSchema),
  })

  useEffect(() => {
    fetchSmtpSettings()
  }, [])

  const fetchSmtpSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings/smtp')
      const data = await response.json()

      if (data.success) {
        setSmtpConfigs(data.data)
      } else {
        console.error('Error fetching SMTP settings:', data.error)
      }
    } catch (error) {
      console.error('Error fetching SMTP settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSmtp = async (data: SmtpFormValues) => {
    try {
      const response = await fetch('/api/admin/settings/smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setIsCreateModalOpen(false)
        form.reset()
        fetchSmtpSettings()
        setSuccessModal({ open: true, title: 'Succès', message: 'Configuration SMTP créée avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de la création de la configuration SMTP' })
      }
    } catch (error) {
      console.error('Error creating SMTP settings:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de la création de la configuration SMTP' })
    }
  }

  const handleEditSmtp = async (data: SmtpFormValues) => {
    if (!editingConfig) return

    try {
      const response = await fetch(`/api/admin/settings/smtp/${editingConfig._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setEditingConfig(null)
        setIsEditModalOpen(false)
        editForm.reset()
        fetchSmtpSettings()
        setSuccessModal({ open: true, title: 'Succès', message: 'Configuration SMTP mise à jour avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de la mise à jour de la configuration SMTP' })
      }
    } catch (error) {
      console.error('Error updating SMTP settings:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de la mise à jour de la configuration SMTP' })
    }
  }

  const deleteSmtp = async (smtpId: string) => {
    try {
      const response = await fetch(`/api/admin/settings/smtp/${smtpId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        fetchSmtpSettings()
        setSuccessModal({ open: true, title: 'Succès', message: 'Configuration SMTP supprimée avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de la suppression de la configuration SMTP' })
      }
    } catch (error) {
      console.error('Error deleting SMTP settings:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de la suppression de la configuration SMTP' })
    }
  }

  const handleDeleteSmtp = (smtpId: string) => {
    setConfirmModal({
      open: true,
      title: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cette configuration SMTP ?',
      onConfirm: () => deleteSmtp(smtpId)
    })
  }

  const handleActivateSmtp = async (smtpId: string) => {
    const smtpToActivate = smtpConfigs.find(s => s._id === smtpId)
    const currentActive = smtpConfigs.find(s => s.isActive)
    
    if (currentActive && currentActive._id !== smtpId) {
      setConfirmModal({
        open: true,
        title: 'Confirmer l\'activation',
        message: `Activer "${smtpToActivate?.name}" désactivera automatiquement "${currentActive.name}". Continuer ?`,
        onConfirm: () => activateSmtp(smtpId)
      })
    } else {
      activateSmtp(smtpId)
    }
  }

  const activateSmtp = async (smtpId: string) => {
    try {
      const response = await fetch(`/api/admin/settings/smtp/${smtpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      })

      const result = await response.json()

      if (result.success) {
        fetchSmtpSettings()
        setSuccessModal({ open: true, title: 'Succès', message: 'Configuration SMTP activée avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de l\'activation de la configuration SMTP' })
      }
    } catch (error) {
      console.error('Error activating SMTP settings:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de l\'activation de la configuration SMTP' })
    }
  }

  const handleDeactivateSmtp = async (smtpId: string) => {
    const smtpToDeactivate = smtpConfigs.find(s => s._id === smtpId)
    
    setConfirmModal({
      open: true,
      title: 'Confirmer la désactivation',
      message: `Désactiver "${smtpToDeactivate?.name}" ? Aucun serveur SMTP ne sera actif après cette action.`,
      onConfirm: () => deactivateSmtp(smtpId)
    })
  }

  const deactivateSmtp = async (smtpId: string) => {
    try {
      const response = await fetch(`/api/admin/settings/smtp/${smtpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: false }),
      })

      const result = await response.json()

      if (result.success) {
        fetchSmtpSettings()
        setSuccessModal({ open: true, title: 'Succès', message: 'Configuration SMTP désactivée avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de la désactivation de la configuration SMTP' })
      }
    } catch (error) {
      console.error('Error deactivating SMTP settings:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de la désactivation de la configuration SMTP' })
    }
  }

  const handleTestSmtp = async (smtpId: string) => {
    if (!testEmail) {
      setErrorModal({ open: true, title: 'Erreur', message: 'Veuillez saisir un email de test' })
      return
    }

    try {
      setTestingId(smtpId)
      const response = await fetch('/api/admin/settings/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpId,
          testEmail,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const config = smtpConfigs.find(c => c._id === smtpId)
        if (config) {
          setSuccessModal({ 
            open: true, 
            title: 'Test réussi', 
            message: `Email de test envoyé avec succès à ${testEmail} via ${config.name}` 
          })
        }
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors du test SMTP' })
      }
    } catch (error) {
      console.error('Error testing SMTP:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors du test SMTP' })
    } finally {
      setTestingId(null)
    }
  }

  const openEditDialog = (smtp: SmtpSettings) => {
    setEditingConfig(smtp)
    editForm.reset({
      name: smtp.name,
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      username: smtp.username,
      password: smtp.password,
      fromEmail: smtp.fromEmail,
      fromName: smtp.fromName,
    })
    setIsEditModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Paramètres Administrateur
        </h1>
        <p className="text-muted-foreground mt-2">
          Configuration et gestion des paramètres système
        </p>
      </div>

      <Tabs defaultValue="smtp" className="space-y-6">
        <TabsList>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Configuration SMTP
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Serveurs SMTP
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gérez vos configurations de serveurs email. Seul un serveur peut être actif à la fois.
                  </p>
                </div>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter SMTP
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Ajouter une configuration SMTP</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleCreateSmtp)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom de la configuration</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Gmail, Outlook..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="host"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Serveur SMTP</FormLabel>
                                <FormControl>
                                  <Input placeholder="smtp.gmail.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="port"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Port</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="587" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="secure"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Connexion sécurisée</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Utiliser SSL/TLS
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

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom d'utilisateur</FormLabel>
                                <FormControl>
                                  <Input placeholder="votre@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fromEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email expéditeur</FormLabel>
                                <FormControl>
                                  <Input placeholder="noreply@vistream.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="fromName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom expéditeur</FormLabel>
                                <FormControl>
                                  <Input placeholder="Vistream" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                          >
                            Annuler
                          </Button>
                          <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Créer
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : smtpConfigs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune configuration SMTP trouvée</p>
                  <p className="text-sm">Ajoutez votre première configuration pour commencer</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <Label htmlFor="testEmail">Email de test</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Configuration</TableHead>
                        <TableHead>Serveur</TableHead>
                        <TableHead>Expéditeur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {smtpConfigs.map((smtp) => (
                        <TableRow key={smtp._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium">{smtp.name}</p>
                                {smtp.isActive && (
                                  <Badge variant="default" className="text-xs">
                                    Actif
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{smtp.host}:{smtp.port}</p>
                              <p className="text-muted-foreground">
                                {smtp.secure ? 'SSL/TLS' : 'Non sécurisé'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{smtp.fromName}</p>
                              <p className="text-muted-foreground">{smtp.fromEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {smtp.isActive ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="text-sm">
                                {smtp.isActive ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(smtp.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestSmtp(smtp._id)}
                                disabled={testingId === smtp._id || !testEmail.trim()}
                                title="Tester la configuration SMTP"
                                className={testingId === smtp._id ? "opacity-50" : ""}
                              >
                                {testingId === smtp._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                              {!smtp.isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleActivateSmtp(smtp._id)}
                                  title="Activer cette configuration"
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                              )}
                              {smtp.isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeactivateSmtp(smtp._id)}
                                  title="Désactiver cette configuration"
                                >
                                  <PowerOff className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(smtp)}
                                title="Modifier la configuration"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSmtp(smtp._id)}
                                title="Supprimer la configuration"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configuration générale de l'application
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Cette section sera développée prochainement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la configuration SMTP</DialogTitle>
          </DialogHeader>
          {editingConfig && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSmtp)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la configuration</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Gmail, Outlook..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serveur SMTP</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="587" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="secure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Connexion sécurisée</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Utiliser SSL/TLS
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom d'utilisateur</FormLabel>
                        <FormControl>
                          <Input placeholder="votre@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe (laisser vide pour ne pas changer)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email expéditeur</FormLabel>
                        <FormControl>
                          <Input placeholder="noreply@vistream.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom expéditeur</FormLabel>
                        <FormControl>
                          <Input placeholder="Vistream" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={editForm.formState.isSubmitting}>
                    {editForm.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Mettre à jour
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {successModal.open && (
        <Dialog open={successModal.open} onOpenChange={() => setSuccessModal({ ...successModal, open: false })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                {successModal.title}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">{successModal.message}</p>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setSuccessModal({ ...successModal, open: false })}
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Error Modal */}
      {errorModal.open && (
        <Dialog open={errorModal.open} onOpenChange={() => setErrorModal({ ...errorModal, open: false })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                {errorModal.title}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">{errorModal.message}</p>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setErrorModal({ ...errorModal, open: false })}
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <Dialog open={confirmModal.open} onOpenChange={() => setConfirmModal({ ...confirmModal, open: false })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                {confirmModal.title}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">{confirmModal.message}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm()
                  }
                  setConfirmModal({ ...confirmModal, open: false })
                }}
              >
                Confirmer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 