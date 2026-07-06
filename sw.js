/**
 * ==========================================================================
 * SERVICE WORKER CACHE ENGINE : BEEZ-I ELITE (OFFLINE COMPLIANT)
 * ==========================================================================
 */

const CACHE_NAME = 'beez-i-elite-v3';
const ASSETS_TO_CACHE = [
    'index.html',
    'style.css',
    'script.js',
    'manifest.json'
];

// Phase d'installation : Mise en cache chirurgicale des ressources vitales
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Beez-i PWA] Cache d’élite initialisé.');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Phase d'activation : Nettoyage des anciennes versions de cache système
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Beez-i PWA] Destruction de l’ancien cache obsolète:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Strategie d'interception réseau : Cache-First avec repli réseau (Ultra-Performance)
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes vers les CDN externes comme Supabase pour ne pas bloquer les données temps réel
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Version en cache trouvée, mise à jour asynchrone en arrière-plan (Stale-While-Revalidate)
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
                    }
                }).catch(() => {/* Silencieux si offline */});
                
                return cachedResponse;
            }

            // Si absent du cache, récupération réseau normale
            return fetch(event.request);
        })
    );
});