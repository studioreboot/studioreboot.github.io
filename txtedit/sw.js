var snapVersion = '8.0.0',
    cacheName = 'snap-pwa',
    filesToCache = [
        'index.html',
        'comegowithme.mp3',
        'editor.js',
        'morphic.js',
        'sound.js',
        'help.txt',
        'test.html',
        'question.mp4',
        'science_answers.txt',
        'FileSaver.js',
        'compiler.js'
    ];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('activate', (evt) => {
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== cacheName) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(
            e.request,
            {'ignoreSearch': true}
        ).then(function(response) {
            return response || fetch(e.request);
        })
    );
});