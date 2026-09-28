importScripts(new URL("./controller/controller.sw.js", self.location).href);

self.addEventListener("activate", event => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", event => {
  if ($scramjetController.shouldRoute(event)) {
    event.respondWith($scramjetController.route(event));
  }
});
