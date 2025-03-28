import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { setCacheNameDetails } from 'workbox-core';
import { cleanupOutdatedCaches, getCacheKeyForURL } from 'workbox-precaching';

setCacheNameDetails({ prefix: "solid-id-wallet" });

// Precache files
precacheAndRoute(self.__WB_MANIFEST);

// Register navigation route for SPA
registerRoute(getCacheKeyForURL("index.html"));

// Clean up outdated caches
cleanupOutdatedCaches();

/*
 * BEGIN: HANDLE UPDATES
 */

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/*
 * END: HANDLE UPDATES
 */

/*
 * BEGIN: HANDLE NOTIFICATIONS
 */

self.addEventListener("notificationclick", (e) => {
  const notification = e.notification;
  //   const primaryKey = notification.data.primaryKey;
  const action = e.action;

  notification.close();
  if (action === "close") {
    return;
  }
  let appURI = new URL("./", location).href;
  e.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url == appURI && "focus" in client) {
            // return client.navigate(`${appURI}inbox/`).then(client => client.focus())
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(appURI).then((client) => client.focus());
        }
      })
  );
});

self.addEventListener("push", (e) => {
  console.log("### PUSH\t|", e.data.text());
  const inboxURI = new URL("./inbox/", location).href; // TODO inbox URL
  let body = "You received a push!";
  if (e.data) {
    body = e.data.text();
  }
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      let isNoticed = false;
      clientList.forEach((client) => {
        if (client.visibilityState !== "visible") return; // if not visibile no need to update
        client.postMessage({ msg: "push", body: body });
        if (client.url !== inboxURI) return; // if not on inbox view, the user may not have noticed
        isNoticed = true;
      });
      if (isNoticed) return;
      const options = {
        badge: "badge.png",
        icon: "favicon.ico",
        body: body,
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: "1",
        },
        actions: [
          { action: "open", title: "Open" },
          { action: "close", title: "Close" },
        ],
      };
      return self.registration.showNotification("Solid Inbox", options);
    })
  );
});

/*
 * END: HANDLE NOTIFICATIONS
 */
