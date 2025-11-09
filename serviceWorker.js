const API_URI = "https://anwesenheits-api.vercel.app/api/v1"

const cacheName = "KarateAnwesenheit"
const cachedURLs = [
    "/AnwesenheitWebApp",
    "/AnwesenheitWebApp/index.html",
    "/AnwesenheitWebApp/style.css",
    "/AnwesenheitWebApp/script.js",
    "/AnwesenheitWebApp/manifest.json",
    "/AnwesenheitWebApp/assets/favicon.png",
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
