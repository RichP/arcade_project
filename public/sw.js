self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // clean old caches if used later
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  // Optional: basic offline fallback for navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch {
        return new Response(
          `<!doctype html><meta charset="utf-8" /><meta name="viewport" content="width=device-width"><title>Offline</title><style>body{background:#0b0e16;color:#cbd5e1;font-family:system-ui;margin:0;display:grid;place-items:center;height:100vh}main{max-width:32rem;padding:1.5rem;border:1px solid rgba(255,255,255,.1);border-radius:1rem;background:rgba(255,255,255,.03)}a{color:#8b5cf6}</style><main><h1>Offline</h1><p>You seem to be offline. Once you’re back online, try again.</p><a href="/">Go home</a></main>`,
          { headers: { "content-type": "text/html" } }
        );
      }
    })());
  }
});
