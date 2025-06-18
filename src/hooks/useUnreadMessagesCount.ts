import { useState, useEffect, useCallback } from 'react'

interface UnreadCountData {
  unreadCount: number
}

export function useUnreadMessagesCount(enabled: boolean = true) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/contacts/unread-count')
      const data = await response.json()

      if (data.success) {
        setUnreadCount(data.data.unreadCount)
        setError(null)
      } else {
        setError(data.error || 'Erreur lors de la récupération du comptage')
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error fetching unread messages count:', error)
      setError('Erreur de connexion')
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  // Refresh count function for manual updates
  const refreshCount = useCallback(() => {
    if (enabled) {
      fetchUnreadCount()
    }
  }, [fetchUnreadCount, enabled])

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0)
      setLoading(false)
      setError(null)
      return
    }

    fetchUnreadCount()

    // Set up polling every 30 seconds to keep count updated
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [fetchUnreadCount, enabled])

  return {
    unreadCount,
    loading,
    error,
    refreshCount
  }
} 