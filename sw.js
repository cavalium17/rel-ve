// Nom et version du cache de l'application
const CACHE_NAME = 'releve-v1';

// Liste des fichiers critiques à mettre en cache pour un accès hors-ligne instantané
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json'
];

/**
 * 1. INSTALLATION DU SERVICE WORKER
 * Déclenché lors du premier chargement ou de la mise à jour de l'application.
 * Met en cache tous les fichiers essentiels de la liste ASSETS_TO_CACHE.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Mise en cache des fichiers de l\'application');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * 2. ACTIVATION DU SERVICE WORKER
 * Nettoie les anciens caches obsolètes pour s'assurer que l'utilisateur 
 * dispose toujours de la version la plus récente de l'application.
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache obsolète :', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * 3. INTERCEPTION DES REQUÊTES (Stratégie Cache First)
 * Sert les fichiers depuis le cache en priorité pour une vitesse maximale 
 * et une disponibilité totale même sans connexion Internet.
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Retourne le fichier du cache s'il est trouvé, sinon effectue une requête réseau
        return cachedResponse || fetch(event.request).catch(() => {
          console.log('[Service Worker] Mode hors-ligne : ressource non disponible en cache', event.request.url);
        });
      })
  );
});