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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm sm:max-w-md">
          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Email envoyé !</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Nous avons envoyé un lien de réinitialisation à votre adresse email. 
                Vérifiez votre boîte de réception et suivez les instructions.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <Button asChild className="w-full h-11 sm:h-12 text-sm sm:text-base">
                  <Link href="/auth/login">
                    Retour à la connexion
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsEmailSent(false)}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base"
                >
                  Essayer une autre adresse
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-xs sm:text-sm text-muted-foreground">
            <p>
              Vous n'avez pas reçu l'email ? Vérifiez vos spams ou{' '}
              <button 
                onClick={() => setIsEmailSent(false)}
                className="hover:underline text-primary transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo and Back Button */}
        <div className="text-center mb-6 sm:mb-8">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors duration-200 group"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Retour à la connexion
          </Link>
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gray-800 rounded-full shadow-md border border-gray-700">
              <Image
                src="/logo.svg"
                alt="Vistream Logo"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12"
              />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Mot de passe oublié</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Réinitialisez votre mot de passe
          </p>
        </div>

        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-6">
            <CardTitle className="text-center flex items-center justify-center space-x-2 text-lg sm:text-xl">
              <KeyRound className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span>Réinitialisation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Saisissez votre adresse email et nous vous enverrons un lien 
                pour réinitialiser votre mot de passe.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-medium">Adresse email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="votre@email.com" 
                            className="pl-10 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 mt-6 sm:mt-8" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Envoyer le lien de réinitialisation
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Vous vous souvenez de votre mot de passe ?{' '}
                <Link 
                  href="/auth/login" 
                  className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 