const API_URI = "http://localhost:3000"

const cacheName = "KarateAnwesenheit"
const cachedURLs = [
    "/",
    "/index.html",
    "/style.css",
    "/script.js",
    "/manifest.json",
    "/assets/favicon.png",
    API_URI + "/classes"
]

self.addEventListener("install", e => {
    caches.delete(cacheName)
})


self.addEventListener("activate", e => {
    e.waitUntil(caches.open(cacheName).then(cache => {
        return cache.addAll(cachedURLs)
    }))
})


self.addEventListener("fetch", e => {
    e.respondWith(caches.match(e.request).then(res => {
        console.log("req", e.request.url, "\n returning", res ? "from cach" : "fetch")
        return res || fetch(e.request)
    }))
})
