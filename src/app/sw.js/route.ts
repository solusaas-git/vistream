import { NextResponse } from 'next/server'

export async function GET() {
  const swContent = `
// Service Worker vide pour éviter les erreurs 404
// Ce fichier peut être supprimé si vous n'utilisez pas de PWA

self.addEventListener('install', function(event) {
  // Ne rien faire lors de l'installation
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Ne rien faire lors de l'activation
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Ne pas intercepter les requêtes, laisser passer normalement
  return;
});
`

  return new NextResponse(swContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
} 