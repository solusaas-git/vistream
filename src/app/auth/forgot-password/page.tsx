'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Mail, Loader2, CheckCircle, KeyRound } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const forgotPasswordSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide."),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la demande de réinitialisation')
      }

      console.log('Password reset request successful:', result)
      setIsEmailSent(true)
    } catch (error) {
      console.error('Password reset error:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la demande de réinitialisation')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Email envoyé !</h2>
              <p className="text-muted-foreground mb-6">
                Nous avons envoyé un lien de réinitialisation à votre adresse email. 
                Vérifiez votre boîte de réception et suivez les instructions.
              </p>
              <div className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    Retour à la connexion
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsEmailSent(false)}
                  className="w-full"
                >
                  Essayer une autre adresse
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>
              Vous n'avez pas reçu l'email ? Vérifiez vos spams ou{' '}
              <button 
                onClick={() => setIsEmailSent(false)}
                className="hover:underline text-primary"
              >
                réessayez
              </button>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Back Button */}
        <div className="text-center mb-8">
          <Link href="/auth/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Link>
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="Vistream Logo"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </div>
          <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
          <p className="text-muted-foreground mt-2">
            Réinitialisez votre mot de passe
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <KeyRound className="h-5 w-5" />
              <span>Réinitialisation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Saisissez votre adresse email et nous vous enverrons un lien 
                pour réinitialiser votre mot de passe.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="votre@email.com" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer le lien de réinitialisation
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Vous vous souvenez de votre mot de passe ?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Si vous rencontrez des problèmes, contactez notre{' '}
            <Link href="/help" className="hover:underline">support technique</Link>.
          </p>
        </div>
      </div>
    </div>
  )
} 