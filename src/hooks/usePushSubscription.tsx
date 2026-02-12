import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// VAPID public key from environment
const VAPID_PUBLIC_KEY = 'BGdYfMMFzZJZKA7wCjVMJ7xjR1t8ZMkjc5yHP7vu2up1g8LzZFa54RwfOu-nlAje4aKmgERrzaSkvfvu3aErPGk';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Check if push is supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        
        // Check if already subscribed
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await (registration as any).pushManager?.getSubscription();
        if (existingSub) {
          setSubscription(existingSub);
          setIsSubscribed(true);
        }
      }
    };
    
    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      toast({
        title: "Niet ondersteund",
        description: "Push notificaties worden niet ondersteund door je browser.",
        variant: "destructive"
      });
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported, toast]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    setIsLoading(true);
    try {
      // Check permission
      let perm = permission;
      if (perm === 'default') {
        perm = await requestPermission();
      }
      
      if (perm !== 'granted') {
        toast({
          title: "Toestemming geweigerd",
          description: "Je hebt notificaties geblokkeerd. Wijzig dit in je browserinstellingen.",
          variant: "destructive"
        });
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const vapidKeyArray = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const newSubscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyArray.buffer as ArrayBuffer
      });

      // Extract keys
      const p256dhBuffer = newSubscription.getKey('p256dh');
      const authBuffer = newSubscription.getKey('auth');
      
      if (!p256dhBuffer || !authBuffer) {
        throw new Error('Kon push keys niet ophalen');
      }

      // Convert ArrayBuffer to base64 string
      const p256dhArray = new Uint8Array(p256dhBuffer);
      const authArray = new Uint8Array(authBuffer);
      
      let p256dhBinary = '';
      for (let i = 0; i < p256dhArray.length; i++) {
        p256dhBinary += String.fromCharCode(p256dhArray[i]);
      }
      
      let authBinary = '';
      for (let i = 0; i < authArray.length; i++) {
        authBinary += String.fromCharCode(authArray[i]);
      }
      
      const p256dhString = btoa(p256dhBinary);
      const authString = btoa(authBinary);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Niet ingelogd');
      }

      // Save subscription to database
      // First check if this exact endpoint already exists
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', newSubscription.endpoint)
        .maybeSingle();

      if (existing) {
        // Update existing subscription
        const { error } = await supabase
          .from('push_subscriptions')
          .update({
            p256dh: p256dhString,
            auth: authString,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new subscription
        const { error } = await supabase
          .from('push_subscriptions')
          .insert({
            user_id: user.id,
            endpoint: newSubscription.endpoint,
            p256dh: p256dhString,
            auth: authString
          });

        if (error) throw error;
      }

      setSubscription(newSubscription);
      setIsSubscribed(true);
      
      toast({
        title: "Notificaties ingeschakeld",
        description: "Je ontvangt nu push notificaties."
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Fout",
        description: "Kon push notificaties niet inschakelen.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return true;
    
    setIsLoading(true);
    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setSubscription(null);
      setIsSubscribed(false);
      
      toast({
        title: "Notificaties uitgeschakeld",
        description: "Je ontvangt geen push notificaties meer."
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: "Fout",
        description: "Kon push notificaties niet uitschakelen.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, toast]);

  // Toggle subscription
  const toggle = useCallback(async (): Promise<boolean> => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    toggle,
    requestPermission
  };
}