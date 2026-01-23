// v4 \\



const cacheName = "KarateAnwesenheit"

const API_URI = "https://anwesenheits-api.vercel.app/api/v1"
const cachedURLs = [
    "/frontend/",
    "/frontend/index.html",
    "/frontend/style.css",
    "/frontend/manifest.json",
    "/frontend/assets/favicon.png",
    "/frontend/assets/spinner.png",
    API_URI + "/classes",
    "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
]



self.addEventListener("install", e => {
    caches.delete(cacheName)
})


self.addEventListener("activate", e => {
    e.waitUntil(caches.open(cacheName).then(cache => {
        cachedURLs.forEach(i => {
            try { cache.add(i) }
            catch(e) { console.error("error", e) }
        })
    }))
})


self.addEventListener("fetch", e => {
    e.respondWith(caches.match(e.request).then(res => {
        console.log("req", e.request.url, "\n returning", res ? "from cache" : "fetch")
        return res || fetch(e.request)
    }))
})
