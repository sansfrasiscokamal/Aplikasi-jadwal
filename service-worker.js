// service-worker.js
const CACHE_NAME = 'jadwal-upload-v1';
const urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'script.js',
    // Tambahkan file icon Anda di sini
    'icon-192x192.png',
    'icon-512x512.png',
    // Tambahkan link Font Awesome jika Anda ingin offline
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Jika tidak ada di cache, ambil dari network
                return fetch(event.request);
            })
    );
});