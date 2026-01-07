// Push notification handler for service worker
// This file is imported by the main service worker

self.addEventListener('push', function(event) {
  console.log('[SW] Push event received:', event);
  
  if (!event.data) {
    console.log('[SW] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const options = {
      body: data.body || 'Je hebt een nieuwe melding',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-192.png',
      tag: data.tag || 'general',
      requireInteraction: true,
      data: {
        url: data.url || '/',
        timestamp: data.timestamp || Date.now()
      },
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'open',
          title: 'Bekijken'
        },
        {
          action: 'close',
          title: 'Sluiten'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Verbouwing Manager', options)
    );
  } catch (error) {
    console.error('[SW] Error handling push event:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (client.url !== urlToOpen) {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        // No window open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[SW] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey
    })
    .then(function(subscription) {
      console.log('[SW] New subscription:', subscription);
      // Note: You would need to send this to your server
      // For now, we just log it - the user will need to re-subscribe in the UI
    })
    .catch(function(error) {
      console.error('[SW] Error re-subscribing:', error);
    })
  );
});