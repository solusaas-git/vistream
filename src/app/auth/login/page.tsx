'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { ArrowLeft, Eye, EyeOff, LogIn, Mail, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const loginSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  rememberMe: z.boolean().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  async function onSubmit(data: LoginFormValues) {
    console.log('Form submitted with data:', data)
    setIsLoading(true)
    try {
      console.log('Sending login request to /api/auth/login')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      const result = await response.json()
      console.log('Response data:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la connexion')
      }

      console.log('Login successful:', result)
      
      // Redirect based on user role
      if (result.user?.role === 'customer') {
        window.location.href = '/admin/subscription'
      } else {
        window.location.href = '/admin'
      }
    } catch (error) {
      console.error('Login error:', error)
      // You could add toast notification here
      alert(error instanceof Error ? error.message : 'Erreur lors de la connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo and Back Button */}
        <div className="text-center mb-6 sm:mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors duration-200 group"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Retour à l'accueil
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Connexion</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Accédez à votre compte Vistream
          </p>
        </div>

        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-6">
            <CardTitle className="text-center flex items-center justify-center space-x-2 text-lg sm:text-xl">
              <LogIn className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span>Se connecter</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit(onSubmit)(e)
                }} 
                method="POST" 
                className="space-y-4 sm:space-y-5"
              >
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
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-medium">Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-11 sm:h-12 text-sm sm:text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      className="rounded border-gray-300 h-4 w-4 text-primary focus:ring-primary focus:ring-2"
                      {...form.register('rememberMe')}
                    />
                    <label htmlFor="rememberMe" className="text-xs sm:text-sm font-normal text-gray-700 cursor-pointer">
                      Se souvenir de moi
                    </label>
                  </div>
                  
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 mt-6 sm:mt-8" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link 
                  href="/auth/signup" 
                  className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 