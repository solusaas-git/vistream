'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MessageSquare,
  Clock,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Hash,
  UserCheck,
  MessageCircle,
  Send,
  Archive,
  Star,
  AlertCircle,
  Flag,
  Zap,
  Globe,
  Monitor,
  FileText
} from 'lucide-react'

interface Contact {
  _id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  tags: string[]
  notes: Array<{
    content: string
    author: {
      _id: string
      firstName: string
      lastName: string
    }
    createdAt: string
  }>
  ipAddress?: string
  userAgent?: string
  source: string
  createdAt: string
  updatedAt: string
  repliedAt?: string
  closedAt?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface ContactStats {
  new: number
  read: number
  replied: number
  closed: number
}

const updateContactSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  tags: z.string().optional(),
  note: z.string().max(1000).optional(),
})

const replySchema = z.object({
  subject: z.string().min(1, "L'objet est requis"),
  message: z.string().min(1, "Le message est requis"),
  includeOriginal: z.boolean().optional(),
})

type UpdateContactFormValues = z.infer<typeof updateContactSchema>
type ReplyFormValues = z.infer<typeof replySchema>

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [stats, setStats] = useState<ContactStats>({
    new: 0,
    read: 0,
    replied: 0,
    closed: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [adminUsers, setAdminUsers] = useState<Array<{_id: string, firstName: string, lastName: string}>>([])

  const form = useForm<UpdateContactFormValues>({
    resolver: zodResolver(updateContactSchema),
    defaultValues: {
      status: undefined,
      priority: undefined,
      assignedTo: '',
      tags: '',
      note: '',
    },
  })

  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      subject: '',
      message: '',
      includeOriginal: false,
    },
  })

  const fetchContacts = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter && priorityFilter !== 'all') params.append('priority', priorityFilter)

      const response = await fetch(`/api/admin/contacts?${params}`)
      const data = await response.json()

      if (data.success) {
        setContacts(data.data.contacts)
        setPagination(data.data.pagination)
        setStats(data.data.stats)
      } else {
        console.error('Error fetching contacts:', data.error)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, priorityFilter, pagination.limit])

  const fetchAdminUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?role=admin&limit=100')
      const data = await response.json()
      if (data.success) {
        setAdminUsers(data.data.users)
      }
    } catch (error) {
      console.error('Error fetching admin users:', error)
    }
  }, [])

  useEffect(() => {
    fetchContacts(1)
    fetchAdminUsers()
  }, [fetchContacts, fetchAdminUsers])

  const handleUpdateContact = async (data: UpdateContactFormValues) => {
    if (!selectedContact) return

    try {
      setIsSubmitting(true)
      
      const updateData: any = {}
      
      if (data.status) updateData.status = data.status
      if (data.priority) updateData.priority = data.priority
      if (data.assignedTo && data.assignedTo !== 'unassigned') updateData.assignedTo = data.assignedTo
      if (data.tags) updateData.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      if (data.note && data.note.trim()) updateData.note = { content: data.note.trim() }
      
      console.log('Frontend: Sending update data:', updateData)
      console.log('Frontend: Selected contact ID:', selectedContact._id)
      
      const response = await fetch(`/api/admin/contacts/${selectedContact._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      console.log('Frontend: Response status:', response.status)
      const result = await response.json()
      console.log('Frontend: Response data:', result)

      if (result.success) {
        setIsEditDialogOpen(false)
        setSelectedContact(null)
        fetchContacts(pagination.page)
        alert('Message mis à jour avec succès!')
      } else {
        console.error('Frontend: Update failed:', result)
        alert(result.error || 'Erreur lors de la mise à jour du message')
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      alert('Erreur lors de la mise à jour du message')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        fetchContacts(pagination.page)
        alert('Message supprimé avec succès!')
      } else {
        alert(result.error || 'Erreur lors de la suppression du message')
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Erreur lors de la suppression du message')
    }
  }

  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact)
    form.reset({
      status: contact.status,
      priority: contact.priority,
      assignedTo: contact.assignedTo?._id || 'unassigned',
      tags: contact.tags.join(', '),
      note: '',
    })
    setIsEditDialogOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4" />
      case 'read':
        return <Eye className="h-4 w-4" />
      case 'replied':
        return <MessageCircle className="h-4 w-4" />
      case 'closed':
        return <Archive className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'read':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'replied':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'closed':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />
      case 'high':
        return <Star className="h-4 w-4" />
      case 'medium':
        return <Clock className="h-4 w-4" />
      case 'low':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'low':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
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

  const handleSendReply = async (data: ReplyFormValues) => {
    if (!selectedContact) return

    try {
      setIsSendingReply(true)
      
      const response = await fetch(`/api/admin/contacts/${selectedContact._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setIsReplyDialogOpen(false)
        setSelectedContact(null)
        fetchContacts(pagination.page)
        alert('Réponse envoyée avec succès!')
      } else {
        alert(result.error || 'Erreur lors de l\'envoi de la réponse')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Erreur lors de l\'envoi de la réponse')
    } finally {
      setIsSendingReply(false)
    }
  }

  const openReplyDialog = (contact: Contact) => {
    setSelectedContact(contact)
    replyForm.reset({
      subject: `Re: ${contact.subject}`,
      message: '',
      includeOriginal: false,
    })
    setIsReplyDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Messages de contact</h1>
          <p className="text-muted-foreground">
            Gérez les messages reçus depuis le formulaire de contact
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nouveaux</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lus</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.read}</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Répondus</p>
                <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fermés</p>
                <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
              </div>
              <Archive className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email, objet..."
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
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="read">Lu</SelectItem>
                <SelectItem value="replied">Répondu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Messages ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Assigné à</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Reçu le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-muted-foreground">{contact.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={contact.subject}>
                          {contact.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(contact.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(contact.status)}
                            {contact.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadgeColor(contact.priority)}>
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(contact.priority)}
                            {contact.priority}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contact.assignedTo ? (
                          <div className="text-sm">
                            {contact.assignedTo.firstName} {contact.assignedTo.lastName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(contact.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedContact(contact)
                              setIsDetailDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteContact(contact._id)}
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
                  {pagination.total} messages
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchContacts(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchContacts(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contact Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du message</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nom</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedContact.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedContact.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Statut</Label>
                  <div className="mt-1">
                    <Badge className={getStatusBadgeColor(selectedContact.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedContact.status)}
                        {selectedContact.status}
                      </div>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Priorité</Label>
                  <div className="mt-1">
                    <Badge className={getPriorityBadgeColor(selectedContact.priority)}>
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(selectedContact.priority)}
                        {selectedContact.priority}
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Objet</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedContact.subject}</p>
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Message</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedContact.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedContact.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment */}
              {selectedContact.assignedTo && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Assigné à</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedContact.assignedTo.firstName} {selectedContact.assignedTo.lastName}
                    <span className="text-muted-foreground ml-2">({selectedContact.assignedTo.email})</span>
                  </p>
                </div>
              )}

              {/* Notes */}
              {selectedContact.notes.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notes</Label>
                  <div className="space-y-3 mt-2">
                    {selectedContact.notes.map((note, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">
                            {note.author.firstName} {note.author.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Info */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <Label className="text-xs font-medium">Source</Label>
                    <p>{selectedContact.source}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">IP</Label>
                    <p>{selectedContact.ipAddress || 'Non disponible'}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Reçu le</Label>
                    <p>{formatDate(selectedContact.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Modifié le</Label>
                    <p>{formatDate(selectedContact.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Fermer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    openEditDialog(selectedContact)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    openReplyDialog(selectedContact)
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Répondre
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le message</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateContact)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">Nouveau</SelectItem>
                            <SelectItem value="read">Lu</SelectItem>
                            <SelectItem value="replied">Répondu</SelectItem>
                            <SelectItem value="closed">Fermé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorité</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une priorité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigner à</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un administrateur" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Non assigné</SelectItem>
                          {adminUsers.map((admin) => (
                            <SelectItem key={admin._id} value={admin._id}>
                              {admin.firstName} {admin.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (séparés par des virgules)</FormLabel>
                      <FormControl>
                        <Input placeholder="support, technique, urgent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ajouter une note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ajouter une note interne..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Mettre à jour
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Contact Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Répondre au message</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <Form {...replyForm}>
              <form onSubmit={replyForm.handleSubmit(handleSendReply)} className="space-y-4">
                <FormField
                  control={replyForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objet</FormLabel>
                      <FormControl>
                        <Input placeholder="Objet de la réponse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={replyForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Écrivez votre réponse ici..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={replyForm.control}
                  name="includeOriginal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Inclure le message original dans la réponse
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsReplyDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSendingReply}>
                    {isSendingReply ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Envoyer
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
  )
} 