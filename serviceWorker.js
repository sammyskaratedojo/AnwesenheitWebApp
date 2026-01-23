// v7 \\



const cacheName = "KarateAnwesenheit"

const API_URI = "https://anwesenheits-api.vercel.app/api/v1"
const WEB_APP_URI = "https://sammyskaratedojo.github.io/AnwesenheitWebApp"
const cachedURLs = [
    WEB_APP_URI + "/",
    WEB_APP_URI + "/index.html",
    WEB_APP_URI + "/style.css",
    WEB_APP_URI + "/manifest.json",
    WEB_APP_URI + "/assets/favicon.png",
    WEB_APP_URI + "/assets/spinner.png",
    API_URI + "/classes",
    "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
]



self.addEventListener("install", e => {
    caches.delete(cacheName)
})


self.addEventListener("activate", e => {
    e.waitUntil(caches.open(cacheName).then(cache => {
        cachedURLs.forEach(i => {
            cache.add(i)
            .catch(e => { console.error("Could not cash URL: '"+ i + "'\n", e) })
        })
    }))
})


self.addEventListener("fetch", e => {
    e.respondWith(caches.match(e.request).then(res => {
        console.log("req", e.request.url, "\n returning", res ? "from cache" : "fetch")
        return res || fetch(e.request)
    }))
})
