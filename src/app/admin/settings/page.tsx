'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
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
  PowerOff,
  CreditCard,
  DollarSign,
  Shield,
  Globe,
  TestTube,
  Zap
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

interface PaymentGateway {
  _id: string
  name: string
  provider: 'mollie' | 'paypal' | 'stripe' | 'square' | 'razorpay' | 'braintree'
  displayName: string
  description: string
  isActive: boolean
  isDefault: boolean
  configuration: {
    mollieApiKey?: string
    mollieTestMode?: boolean
    paypalClientId?: string
    paypalClientSecret?: string
    paypalSandbox?: boolean
    stripePublishableKey?: string
    stripeSecretKey?: string
    stripeTestMode?: boolean
    webhookUrl?: string
    webhookSecret?: string
    additionalSettings?: any
  }
  supportedCurrencies: string[]
  supportedPaymentMethods: string[]
  fees: {
    fixedFee: number
    percentageFee: number
    currency: string
  }
  limits: {
    minAmount: number
    maxAmount: number
    currency: string
  }
  status: 'active' | 'inactive' | 'testing' | 'maintenance'
  lastTestedAt?: string
  testResults?: {
    success: boolean
    message: string
    testedAt: string
  }
  createdAt: string
  updatedAt: string
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

const paymentGatewaySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  provider: z.enum(['mollie', 'paypal', 'stripe', 'square', 'razorpay', 'braintree']),
  displayName: z.string().min(1, "Le nom d'affichage est requis").max(100, "Le nom d'affichage ne peut pas dépasser 100 caractères"),
  description: z.string().max(500, "La description ne peut pas dépasser 500 caractères").optional(),
  mollieApiKey: z.string().optional(),
  mollieTestMode: z.boolean().optional(),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
  paypalSandbox: z.boolean().optional(),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeTestMode: z.boolean().optional(),
  webhookUrl: z.string().url("URL de webhook invalide").optional().or(z.literal("")),
  webhookSecret: z.string().optional(),
  fixedFee: z.number().min(0, "Les frais fixes doivent être positifs").optional(),
  percentageFee: z.number().min(0, "Les frais en pourcentage doivent être positifs").max(100, "Les frais en pourcentage ne peuvent pas dépasser 100%").optional(),
  minAmount: z.number().min(0, "Le montant minimum doit être positif").optional(),
  maxAmount: z.number().min(0, "Le montant maximum doit être positif").optional(),
})

const testPaymentSchema = z.object({
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0").max(1000, "Le montant ne peut pas dépasser 1000€"),
  currency: z.string().min(1, "La devise est requise"),
  description: z.string().min(1, "La description est requise").max(200, "La description ne peut pas dépasser 200 caractères"),
  customerEmail: z.string().email("Email invalide").optional(),
  customerName: z.string().max(100, "Le nom ne peut pas dépasser 100 caractères").optional(),
})

type SmtpFormValues = z.infer<typeof smtpSchema>
type PaymentGatewayFormValues = z.infer<typeof paymentGatewaySchema>
type TestPaymentFormValues = z.infer<typeof testPaymentSchema>

/**
 * Admin Settings Page with URL-based tab navigation
 * 
 * URLs:
 * - /admin/settings?tab=smtp (default)
 * - /admin/settings?tab=payment-gateways
 * - /admin/settings?tab=general
 */
export default function AdminSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'smtp')
  
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpSettings[]>([])
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [gatewayLoading, setGatewayLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateGatewayModalOpen, setIsCreateGatewayModalOpen] = useState(false)
  const [isEditGatewayModalOpen, setIsEditGatewayModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SmtpSettings | null>(null)
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testingGatewayId, setTestingGatewayId] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [isTestPaymentModalOpen, setIsTestPaymentModalOpen] = useState(false)
  const [selectedGatewayForTest, setSelectedGatewayForTest] = useState<PaymentGateway | null>(null)
  
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

  const gatewayForm = useForm<PaymentGatewayFormValues>({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: {
      name: 'Mollie Production',
      provider: 'mollie',
      displayName: 'Paiement par carte',
      description: 'Paiements sécurisés via Mollie - Cartes, iDEAL, PayPal et plus',
      // Mollie fields
      mollieApiKey: '',
      mollieTestMode: true,
      // PayPal fields
      paypalClientId: '',
      paypalClientSecret: '',
      paypalSandbox: true,
      // Stripe fields
      stripePublishableKey: '',
      stripeSecretKey: '',
      stripeTestMode: true,
      // Common fields
      webhookUrl: '',
      webhookSecret: '',
      // Fee and limit fields
      fixedFee: 0,
      percentageFee: 2.9,
      minAmount: 0.01,
      maxAmount: 10000,
    },
  })

  const editGatewayForm = useForm<PaymentGatewayFormValues>({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: {
      name: '',
      provider: 'mollie',
      displayName: '',
      description: '',
      // Mollie fields
      mollieApiKey: '',
      mollieTestMode: true,
      // PayPal fields
      paypalClientId: '',
      paypalClientSecret: '',
      paypalSandbox: true,
      // Stripe fields
      stripePublishableKey: '',
      stripeSecretKey: '',
      stripeTestMode: true,
      // Common fields
      webhookUrl: '',
      webhookSecret: '',
      // Fee and limit fields
      fixedFee: 0,
      percentageFee: 0,
      minAmount: 0.01,
      maxAmount: 10000,
    },
  })

  const testPaymentForm = useForm<TestPaymentFormValues>({
    resolver: zodResolver(testPaymentSchema),
    defaultValues: {
      amount: 10.00,
      currency: 'EUR',
      description: 'Test de paiement',
      customerEmail: '',
      customerName: '',
    },
  })

  // Watch for provider changes to update form defaults
  const selectedProvider = gatewayForm.watch('provider')
  
  useEffect(() => {
    if (selectedProvider === 'mollie') {
      gatewayForm.setValue('name', 'Mollie Production')
      gatewayForm.setValue('displayName', 'Paiement par carte')
      gatewayForm.setValue('description', 'Paiements sécurisés via Mollie - Cartes, iDEAL, PayPal et plus')
      gatewayForm.setValue('percentageFee', 2.9)
    } else if (selectedProvider === 'paypal') {
      gatewayForm.setValue('name', 'PayPal Production')
      gatewayForm.setValue('displayName', 'PayPal')
      gatewayForm.setValue('description', 'Paiements via PayPal')
      gatewayForm.setValue('percentageFee', 3.4)
    } else if (selectedProvider === 'stripe') {
      gatewayForm.setValue('name', 'Stripe Production')
      gatewayForm.setValue('displayName', 'Paiement par carte')
      gatewayForm.setValue('description', 'Paiements sécurisés via Stripe')
      gatewayForm.setValue('percentageFee', 2.9)
    }
  }, [selectedProvider, gatewayForm])

  // Handle tab changes and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`/admin/settings?${params.toString()}`, { scroll: false })
  }

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['smtp', 'payment-gateways', 'general'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Update document title based on active tab
  useEffect(() => {
    const tabTitles = {
      'smtp': 'Configuration SMTP',
      'payment-gateways': 'Passerelles de Paiement',
      'general': 'Général'
    }
    document.title = `Paramètres - ${tabTitles[activeTab as keyof typeof tabTitles] || 'Administrateur'} | Vistream`
  }, [activeTab])

  useEffect(() => {
    fetchSmtpSettings()
    fetchPaymentGateways()
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

  const fetchPaymentGateways = async () => {
    try {
      setGatewayLoading(true)
      const response = await fetch('/api/admin/settings/payment-gateways')
      const data = await response.json()

      if (data.success) {
        setPaymentGateways(data.data)
      } else {
        console.error('Error fetching payment gateways:', data.error)
      }
    } catch (error) {
      console.error('Error fetching payment gateways:', error)
    } finally {
      setGatewayLoading(false)
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

  // Payment Gateway Functions
  const handleCreatePaymentGateway = async (data: PaymentGatewayFormValues) => {
    try {
      // Build configuration object based on provider
      const configuration: any = {}
      
      switch (data.provider) {
        case 'mollie':
          configuration.mollieApiKey = data.mollieApiKey
          configuration.mollieTestMode = data.mollieTestMode ?? true
          break
        case 'paypal':
          configuration.paypalClientId = data.paypalClientId
          configuration.paypalClientSecret = data.paypalClientSecret
          configuration.paypalSandbox = data.paypalSandbox ?? true
          break
        case 'stripe':
          configuration.stripePublishableKey = data.stripePublishableKey
          configuration.stripeSecretKey = data.stripeSecretKey
          configuration.stripeTestMode = data.stripeTestMode ?? true
          break
      }
      
      if (data.webhookUrl) {
        configuration.webhookUrl = data.webhookUrl
      }
      if (data.webhookSecret) {
        configuration.webhookSecret = data.webhookSecret
      }

      const payload = {
        name: data.name,
        provider: data.provider,
        displayName: data.displayName,
        description: data.description,
        configuration,
        fees: {
          fixedFee: data.fixedFee || 0,
          percentageFee: data.percentageFee || 0,
          currency: 'EUR'
        },
        limits: {
          minAmount: data.minAmount || 0.01,
          maxAmount: data.maxAmount || 10000,
          currency: 'EUR'
        }
      }

      const response = await fetch('/api/admin/settings/payment-gateways', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        setIsCreateGatewayModalOpen(false)
        gatewayForm.reset()
        fetchPaymentGateways()
        setSuccessModal({ open: true, title: 'Succès', message: 'Passerelle de paiement créée avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de la création de la passerelle de paiement' })
      }
    } catch (error) {
      console.error('Error creating payment gateway:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de la création de la passerelle de paiement' })
    }
  }

  const handleTestGateway = (gateway: PaymentGateway) => {
    setSelectedGatewayForTest(gateway)
    setIsTestPaymentModalOpen(true)
  }

  const handleTestPayment = async (data: TestPaymentFormValues) => {
    if (!selectedGatewayForTest) return

    try {
      setTestingGatewayId(selectedGatewayForTest._id)
      
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          gatewayId: selectedGatewayForTest._id,
          isTest: true,
        }),
      })

      const result = await response.json()

      if (result.success && result.data.checkoutUrl) {
        // Open payment URL in new tab
        window.open(result.data.checkoutUrl, '_blank')
        setIsTestPaymentModalOpen(false)
        testPaymentForm.reset()
        setSuccessModal({
          open: true,
          title: 'Test de paiement créé',
          message: 'Le paiement de test a été créé et ouvert dans un nouvel onglet. Complétez le paiement pour tester la passerelle.'
        })
      } else {
        setErrorModal({
          open: true,
          title: 'Erreur lors du test',
          message: result.error || 'Erreur lors de la création du paiement de test'
        })
      }
    } catch (error) {
      console.error('Error creating test payment:', error)
      setErrorModal({
        open: true,
        title: 'Erreur',
        message: 'Erreur lors de la création du paiement de test'
      })
    } finally {
      setTestingGatewayId(null)
    }
  }

  const openEditGatewayDialog = (gateway: PaymentGateway) => {
    setEditingGateway(gateway)
    
    // Populate edit form with gateway data
    editGatewayForm.reset({
      name: gateway.name,
      provider: gateway.provider,
      displayName: gateway.displayName,
      description: gateway.description || '',
      // Mollie fields
      mollieApiKey: gateway.configuration?.mollieApiKey || '',
      mollieTestMode: gateway.configuration?.mollieTestMode || false,
      // PayPal fields
      paypalClientId: gateway.configuration?.paypalClientId || '',
      paypalClientSecret: gateway.configuration?.paypalClientSecret || '',
      paypalSandbox: gateway.configuration?.paypalSandbox || false,
      // Stripe fields
      stripePublishableKey: gateway.configuration?.stripePublishableKey || '',
      stripeSecretKey: gateway.configuration?.stripeSecretKey || '',
      stripeTestMode: gateway.configuration?.stripeTestMode || false,
      // Common fields
      webhookUrl: gateway.configuration?.webhookUrl || '',
      webhookSecret: gateway.configuration?.webhookSecret || '',
      // Fee and limit fields
      fixedFee: gateway.fees?.fixedFee || 0,
      percentageFee: gateway.fees?.percentageFee || 0,
      minAmount: gateway.limits?.minAmount || 0.01,
      maxAmount: gateway.limits?.maxAmount || 10000,
    })
    
    setIsEditGatewayModalOpen(true)
  }

  const handleEditPaymentGateway = async (data: PaymentGatewayFormValues) => {
    if (!editingGateway) return

    try {
      const response = await fetch(`/api/admin/settings/payment-gateways/${editingGateway._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          configuration: {
            // Mollie fields
            mollieApiKey: data.mollieApiKey,
            mollieTestMode: data.mollieTestMode,
            // PayPal fields
            paypalClientId: data.paypalClientId,
            paypalClientSecret: data.paypalClientSecret,
            paypalSandbox: data.paypalSandbox,
            // Stripe fields
            stripePublishableKey: data.stripePublishableKey,
            stripeSecretKey: data.stripeSecretKey,
            stripeTestMode: data.stripeTestMode,
            // Common fields
            webhookUrl: data.webhookUrl,
            webhookSecret: data.webhookSecret,
          },
          fees: {
            fixedFee: data.fixedFee || 0,
            percentageFee: data.percentageFee || 0,
            currency: 'EUR'
          },
          limits: {
            minAmount: data.minAmount || 0.01,
            maxAmount: data.maxAmount || 10000,
            currency: 'EUR'
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        setIsEditGatewayModalOpen(false)
        setEditingGateway(null)
        editGatewayForm.reset()
        fetchPaymentGateways()
        setSuccessModal({ open: true, title: 'Succès', message: 'Passerelle de paiement mise à jour avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de la mise à jour de la passerelle' })
      }
    } catch (error) {
      console.error('Error updating payment gateway:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de la mise à jour de la passerelle' })
    }
  }

  const handleActivateGateway = async (gatewayId: string) => {
    const gatewayToActivate = paymentGateways.find(g => g._id === gatewayId)
    const currentActive = paymentGateways.find(g => g.isActive)
    
    if (currentActive && currentActive._id !== gatewayId) {
      setConfirmModal({
        open: true,
        title: 'Confirmer l\'activation',
        message: `Activer "${gatewayToActivate?.displayName}" désactivera automatiquement "${currentActive.displayName}". Continuer ?`,
        onConfirm: () => activateGateway(gatewayId)
      })
    } else {
      activateGateway(gatewayId)
    }
  }

  const activateGateway = async (gatewayId: string) => {
    try {
      const response = await fetch(`/api/admin/settings/payment-gateways/${gatewayId}/activate`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        fetchPaymentGateways()
        setSuccessModal({ open: true, title: 'Succès', message: 'Passerelle de paiement activée avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de l\'activation de la passerelle' })
      }
    } catch (error) {
      console.error('Error activating gateway:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de l\'activation de la passerelle' })
    }
  }

  const handleDeactivateGateway = async (gatewayId: string) => {
    const gatewayToDeactivate = paymentGateways.find(g => g._id === gatewayId)
    
    setConfirmModal({
      open: true,
      title: 'Confirmer la désactivation',
      message: `Désactiver "${gatewayToDeactivate?.displayName}" ? Aucune passerelle ne sera active après cette action.`,
      onConfirm: () => deactivateGateway(gatewayId)
    })
  }

  const deactivateGateway = async (gatewayId: string) => {
    try {
      const response = await fetch(`/api/admin/settings/payment-gateways/${gatewayId}/deactivate`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        fetchPaymentGateways()
        setSuccessModal({ open: true, title: 'Succès', message: 'Passerelle de paiement désactivée avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de la désactivation de la passerelle' })
      }
    } catch (error) {
      console.error('Error deactivating gateway:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de la désactivation de la passerelle' })
    }
  }

  const handleDeleteGateway = (gatewayId: string) => {
    const gatewayToDelete = paymentGateways.find(g => g._id === gatewayId)
    
    setConfirmModal({
      open: true,
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer la passerelle "${gatewayToDelete?.displayName}" ? Cette action est irréversible.`,
      onConfirm: () => deleteGateway(gatewayId)
    })
  }

  const deleteGateway = async (gatewayId: string) => {
    try {
      const response = await fetch(`/api/admin/settings/payment-gateways/${gatewayId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        fetchPaymentGateways()
        setSuccessModal({ open: true, title: 'Succès', message: 'Passerelle de paiement supprimée avec succès!' })
      } else {
        setErrorModal({ open: true, title: 'Erreur', message: result.error || 'Erreur lors de la suppression de la passerelle' })
      }
    } catch (error) {
      console.error('Error deleting gateway:', error)
      setErrorModal({ open: true, title: 'Erreur', message: 'Erreur lors de la suppression de la passerelle' })
    }
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

  // Get provider icon/logo component
  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'mollie':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <span className="text-white font-bold text-sm">M</span>
          </div>
        )
      case 'paypal':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
            <span className="text-white font-bold text-sm">PP</span>
          </div>
        )
      case 'stripe':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700">
            <span className="text-white font-bold text-sm">S</span>
          </div>
        )
      case 'square':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-black">
            <span className="text-white font-bold text-sm">□</span>
          </div>
        )
      case 'razorpay':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <span className="text-white font-bold text-sm">R</span>
          </div>
        )
      case 'braintree':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
            <span className="text-white font-bold text-sm">BT</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
        )
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Paramètres Administrateur
          {activeTab === 'smtp' && ' - Configuration SMTP'}
          {activeTab === 'payment-gateways' && ' - Passerelles de Paiement'}
          {activeTab === 'general' && ' - Général'}
        </h1>
        <p className="text-muted-foreground mt-2">
          Configuration et gestion des paramètres système
        </p>
      </div>

              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Configuration SMTP
          </TabsTrigger>
          <TabsTrigger value="payment-gateways" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Passerelles de Paiement
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment-gateways">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Passerelles de Paiement
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gérez vos passerelles de paiement. Mollie est configuré par défaut, avec support pour PayPal et Stripe.
                  </p>
                </div>
                <Dialog open={isCreateGatewayModalOpen} onOpenChange={setIsCreateGatewayModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Passerelle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Ajouter une passerelle de paiement</DialogTitle>
                    </DialogHeader>
                    <Form {...gatewayForm}>
                      <form onSubmit={gatewayForm.handleSubmit(handleCreatePaymentGateway)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={gatewayForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom de la passerelle</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Mollie Production" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={gatewayForm.control}
                            name="provider"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fournisseur</FormLabel>
                                <FormControl>
                                  <select 
                                    {...field} 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <option value="mollie">Mollie</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="stripe">Stripe</option>
                                    <option value="square">Square</option>
                                    <option value="razorpay">Razorpay</option>
                                    <option value="braintree">Braintree</option>
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={gatewayForm.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom d'affichage</FormLabel>
                              <FormControl>
                                <Input placeholder="Nom affiché aux utilisateurs" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={gatewayForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (optionnel)</FormLabel>
                              <FormControl>
                                <Input placeholder="Description de la passerelle" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Provider-specific configuration */}
                        {gatewayForm.watch('provider') === 'mollie' && (
                          <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium">Configuration Mollie</h3>
                              <a 
                                href="https://docs.mollie.com/docs/getting-started" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                Guide Mollie
                                <Globe className="h-3 w-3" />
                              </a>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                              <p className="font-medium text-blue-900 mb-1">Configuration Mollie :</p>
                              <ul className="text-blue-800 space-y-1 text-xs">
                                <li>• Créez un compte sur <a href="https://mollie.com" target="_blank" className="underline">mollie.com</a></li>
                                <li>• Récupérez votre clé API dans Développeurs → Clés API</li>
                                <li>• Utilisez une clé test (test_...) pour les tests</li>
                                <li>• Passez à une clé live (live_...) pour la production</li>
                              </ul>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              <FormField
                                control={gatewayForm.control}
                                name="mollieApiKey"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Clé API Mollie *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="password" 
                                        placeholder="live_... ou test_..." 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                      Trouvez votre clé API dans votre tableau de bord Mollie sous Développeurs → Clés API
                                    </p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={gatewayForm.control}
                                name="mollieTestMode"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                      <FormLabel>Mode Test</FormLabel>
                                      <div className="text-sm text-muted-foreground">
                                        Utiliser l'environnement de test Mollie
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
                                control={gatewayForm.control}
                                name="webhookUrl"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>URL de Webhook (optionnel)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="https://votre-site.com/api/webhooks/mollie" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                      URL pour recevoir les notifications de statut de paiement
                                    </p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={gatewayForm.control}
                                name="webhookSecret"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Secret Webhook (optionnel)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="password"
                                        placeholder="Secret pour vérifier les webhooks" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                      Secret utilisé pour vérifier l'authenticité des webhooks Mollie
                                    </p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}

                        {gatewayForm.watch('provider') === 'paypal' && (
                          <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-medium">Configuration PayPal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={gatewayForm.control}
                                name="paypalClientId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Client ID *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="PayPal Client ID" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={gatewayForm.control}
                                name="paypalClientSecret"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Client Secret *</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="PayPal Client Secret" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={gatewayForm.control}
                              name="paypalSandbox"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Mode Sandbox</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Utiliser l'environnement de test PayPal
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
                        )}

                        {gatewayForm.watch('provider') === 'stripe' && (
                          <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-medium">Configuration Stripe</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={gatewayForm.control}
                                name="stripePublishableKey"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Clé Publique *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="pk_test_... ou pk_live_..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={gatewayForm.control}
                                name="stripeSecretKey"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Clé Secrète *</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="sk_test_... ou sk_live_..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={gatewayForm.control}
                              name="stripeTestMode"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Mode Test</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Utiliser l'environnement de test Stripe
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
                        )}

                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsCreateGatewayModalOpen(false)}>
                            Annuler
                          </Button>
                          <Button type="submit">
                            Créer la passerelle
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {gatewayLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Chargement des passerelles...</span>
                </div>
              ) : paymentGateways.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune passerelle de paiement configurée</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ajoutez Mollie, PayPal, Stripe ou d'autres passerelles pour accepter les paiements
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {paymentGateways.length} passerelle{paymentGateways.length > 1 ? 's' : ''} configurée{paymentGateways.length > 1 ? 's' : ''}
                  </p>
                  <div className="grid gap-4">
                    {paymentGateways.map((gateway) => (
                      <div key={gateway._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getProviderIcon(gateway.provider)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{gateway.displayName}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {gateway.provider.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{gateway.name}</p>
                              {gateway.description && (
                                <p className="text-sm text-muted-foreground mt-1">{gateway.description}</p>
                              )}
                              
                              {/* Configuration info */}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {gateway.provider === 'mollie' && gateway.configuration?.mollieTestMode && (
                                  <span className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Mode Test
                                  </span>
                                )}
                                {gateway.provider === 'paypal' && gateway.configuration?.paypalSandbox && (
                                  <span className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Sandbox
                                  </span>
                                )}
                                {gateway.provider === 'stripe' && gateway.configuration?.stripeTestMode && (
                                  <span className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Mode Test
                                  </span>
                                )}
                                {gateway.lastTestedAt && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Testé le {formatDate(gateway.lastTestedAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={gateway.isActive ? "default" : "secondary"} className="text-xs">
                                  {gateway.isActive ? "Actif" : "Inactif"}
                                </Badge>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTestGateway(gateway)}
                                  disabled={testingGatewayId === gateway._id}
                                  className="h-8 w-8 p-0"
                                  title="Tester la connexion"
                                >
                                  {testingGatewayId === gateway._id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Zap className="h-3 w-3" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditGatewayDialog(gateway)}
                                  className="h-8 w-8 p-0"
                                  title="Modifier la passerelle"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                
                                {gateway.isActive ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeactivateGateway(gateway._id)}
                                    className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                                    title="Désactiver la passerelle"
                                  >
                                    <PowerOff className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleActivateGateway(gateway._id)}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    title="Activer la passerelle"
                                  >
                                    <Power className="h-3 w-3" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteGateway(gateway._id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  title="Supprimer la passerelle"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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

      {/* Edit Gateway Modal */}
      <Dialog open={isEditGatewayModalOpen} onOpenChange={setIsEditGatewayModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la passerelle de paiement</DialogTitle>
          </DialogHeader>
          {editingGateway && (
            <Form {...editGatewayForm}>
              <form onSubmit={editGatewayForm.handleSubmit(handleEditPaymentGateway)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editGatewayForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la passerelle</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Mollie Production" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editGatewayForm.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fournisseur</FormLabel>
                        <FormControl>
                          <select 
                            {...field} 
                            disabled
                            className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="mollie">Mollie</option>
                            <option value="paypal">PayPal</option>
                            <option value="stripe">Stripe</option>
                            <option value="square">Square</option>
                            <option value="razorpay">Razorpay</option>
                            <option value="braintree">Braintree</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editGatewayForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'affichage</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom affiché aux utilisateurs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editGatewayForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Description de la passerelle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Provider-specific configuration */}
                {editGatewayForm.watch('provider') === 'mollie' && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Configuration Mollie</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={editGatewayForm.control}
                        name="mollieApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clé API Mollie *</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="live_... ou test_..." 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editGatewayForm.control}
                        name="mollieTestMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Mode Test</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Utiliser l'environnement de test Mollie
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
                         control={editGatewayForm.control}
                         name="webhookUrl"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>URL de Webhook (optionnel)</FormLabel>
                             <FormControl>
                               <Input 
                                 placeholder="https://votre-site.com/api/webhooks/mollie" 
                                 {...field} 
                               />
                             </FormControl>
                             <p className="text-sm text-muted-foreground">
                               URL pour recevoir les notifications de statut de paiement
                             </p>
                             <FormMessage />
                           </FormItem>
                         )}
                       />

                       <FormField
                         control={editGatewayForm.control}
                         name="webhookSecret"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Secret Webhook (optionnel)</FormLabel>
                             <FormControl>
                               <Input 
                                 type="password" 
                                 placeholder="Secret pour vérifier les webhooks" 
                                 {...field} 
                               />
                             </FormControl>
                             <p className="text-sm text-muted-foreground">
                               Secret utilisé pour vérifier l'authenticité des webhooks Mollie
                             </p>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                    </div>
                  </div>
                )}

                {editGatewayForm.watch('provider') === 'paypal' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-medium">Configuration PayPal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={editGatewayForm.control}
                        name="paypalClientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client ID *</FormLabel>
                            <FormControl>
                              <Input placeholder="PayPal Client ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editGatewayForm.control}
                        name="paypalClientSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Secret *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="PayPal Client Secret" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                                         <FormField
                       control={editGatewayForm.control}
                       name="paypalSandbox"
                       render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                           <div className="space-y-0.5">
                             <FormLabel>Mode Sandbox</FormLabel>
                             <div className="text-sm text-muted-foreground">
                               Utiliser l'environnement de test PayPal
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
                       control={editGatewayForm.control}
                       name="webhookUrl"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>URL de Webhook (optionnel)</FormLabel>
                           <FormControl>
                             <Input 
                               placeholder="https://votre-site.com/api/webhooks/paypal" 
                               {...field} 
                             />
                           </FormControl>
                           <p className="text-sm text-muted-foreground">
                             URL pour recevoir les notifications PayPal
                           </p>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </div>
                 )}

                {editGatewayForm.watch('provider') === 'stripe' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-medium">Configuration Stripe</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={editGatewayForm.control}
                        name="stripePublishableKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clé Publique *</FormLabel>
                            <FormControl>
                              <Input placeholder="pk_test_... ou pk_live_..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editGatewayForm.control}
                        name="stripeSecretKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clé Secrète *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="sk_test_... ou sk_live_..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                                         <FormField
                       control={editGatewayForm.control}
                       name="stripeTestMode"
                       render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                           <div className="space-y-0.5">
                             <FormLabel>Mode Test</FormLabel>
                             <div className="text-sm text-muted-foreground">
                               Utiliser l'environnement de test Stripe
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
                       control={editGatewayForm.control}
                       name="webhookUrl"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>URL de Webhook (optionnel)</FormLabel>
                           <FormControl>
                             <Input 
                               placeholder="https://votre-site.com/api/webhooks/stripe" 
                               {...field} 
                             />
                           </FormControl>
                           <p className="text-sm text-muted-foreground">
                             URL pour recevoir les notifications Stripe
                           </p>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </div>
                 )}

                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditGatewayModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    Mettre à jour
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Payment Modal */}
      <Dialog open={isTestPaymentModalOpen} onOpenChange={setIsTestPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedGatewayForTest && getProviderIcon(selectedGatewayForTest.provider)}
              <div>
                <div>Test de Paiement</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {selectedGatewayForTest?.displayName}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <Form {...testPaymentForm}>
            <form onSubmit={testPaymentForm.handleSubmit(handleTestPayment)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={testPaymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="10.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={testPaymentForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Devise</FormLabel>
                      <FormControl>
                        <select 
                          {...field} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={testPaymentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Test de paiement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={testPaymentForm.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email client (optionnel)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="test@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={testPaymentForm.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom client (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">ℹ️ Test de paiement</p>
                <p className="text-blue-800 text-xs">
                  Un paiement de test sera créé et ouvert dans un nouvel onglet. 
                  Utilisez les données de test de votre fournisseur pour compléter la transaction.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTestPaymentModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={testingGatewayId === selectedGatewayForTest?._id}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {testingGatewayId === selectedGatewayForTest?._id && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Créer le test
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 