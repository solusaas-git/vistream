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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Back Button */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
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
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-muted-foreground mt-2">
            Accédez à votre compte Vistream
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <LogIn className="h-5 w-5" />
              <span>Se connecter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit(onSubmit)(e)
                }} 
                method="POST" 
                className="space-y-4"
              >
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
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      className="rounded border-gray-300"
                      {...form.register('rememberMe')}
                    />
                    <label htmlFor="rememberMe" className="text-sm font-normal">
                      Se souvenir de moi
                    </label>
                  </div>
                  
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </>
                  )}
                </Button>


              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Pas encore de compte ?{' '}
                <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            En vous connectant, vous acceptez nos{' '}
            <Link href="/legal" className="hover:underline">conditions d'utilisation</Link>
            {' '}et notre{' '}
            <Link href="/privacy" className="hover:underline">politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </div>
  )
} 