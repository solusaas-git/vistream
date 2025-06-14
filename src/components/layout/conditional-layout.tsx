'use client'

import { usePathname } from 'next/navigation'
import { MainLayout } from './main-layout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Check if we're on routes that should not have the main layout
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/auth')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  
  if (isAdminRoute || isAuthRoute || isDashboardRoute) {
    // These routes get no main layout wrapper - they have their own layout or are standalone
    return <>{children}</>
  }
  
  // Regular routes get the main layout with header/footer
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
} 