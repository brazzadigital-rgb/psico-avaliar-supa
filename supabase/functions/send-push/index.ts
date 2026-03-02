import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    event_key?: string;
  };
}

interface SendPushRequest {
  user_id?: string;
  test?: boolean;
  title: string;
  body: string;
  action_url?: string;
  event_key?: string;
  priority?: "low" | "normal" | "high";
}

interface PushSubscriptionData {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_label: string | null;
}

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Convert Uint8Array to base64url
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Create JWT for VAPID authentication
async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string,
  publicKeyBase64: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const privateKeyData = base64UrlToUint8Array(privateKeyBase64);
  
  let keyBytes = privateKeyData;
  if (keyBytes.length < 32) {
    const padded = new Uint8Array(32);
    padded.set(keyBytes, 32 - keyBytes.length);
    keyBytes = padded;
  }

  // Create PKCS8 wrapper for raw private key
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  
  const publicKeyBytes = base64UrlToUint8Array(publicKeyBase64);
  const suffix = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00]);
  
  const pkcs8Key = new Uint8Array(pkcs8Header.length + 32 + suffix.length + publicKeyBytes.length);
  pkcs8Key.set(pkcs8Header);
  pkcs8Key.set(keyBytes.slice(0, 32), pkcs8Header.length);
  pkcs8Key.set(suffix, pkcs8Header.length + 32);
  pkcs8Key.set(publicKeyBytes, pkcs8Header.length + 32 + suffix.length);

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Key.buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sigArray = new Uint8Array(signature);
  let rawSignature: Uint8Array;
  
  if (sigArray.length === 64) {
    rawSignature = sigArray;
  } else {
    let offset = 2;
    if (sigArray[1] > 0x80) offset += sigArray[1] - 0x80;
    
    offset += 1;
    const rLen = sigArray[offset++];
    const rStart = offset;
    offset += rLen;
    
    offset += 1;
    const sLen = sigArray[offset++];
    const sStart = offset;
    
    rawSignature = new Uint8Array(64);
    const rBytes = sigArray.slice(rStart, rStart + rLen);
    const sBytes = sigArray.slice(sStart, sStart + sLen);
    
    rawSignature.set(rBytes.slice(-32), 32 - Math.min(rBytes.length, 32));
    rawSignature.set(sBytes.slice(-32), 64 - Math.min(sBytes.length, 32));
  }

  const signatureB64 = uint8ArrayToBase64Url(rawSignature);
  return `${unsignedToken}.${signatureB64}`;
}

// Send push notification to a single subscription
async function sendPushToSubscription(
  subscription: PushSubscriptionData,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  senderEmail: string
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  try {
    const endpoint = subscription.endpoint;
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const jwt = await createVapidJwt(
      audience,
      `mailto:${senderEmail}`,
      vapidPrivateKey,
      vapidPublicKey
    );

    // Generate local key pair for ECDH
    const localKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"]
    );

    const localPublicKey = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
    const localPublicKeyBytes = new Uint8Array(localPublicKey);

    // Import subscription's public key
    const clientPublicKey = base64UrlToUint8Array(subscription.p256dh);
    const clientCryptoKey = await crypto.subtle.importKey(
      "raw",
      clientPublicKey.buffer as ArrayBuffer,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    // Derive shared secret
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientCryptoKey },
      localKeyPair.privateKey,
      256
    );

    const authSecret = base64UrlToUint8Array(subscription.auth);

    // Salt for this message
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Key derivation
    const sharedSecretKey = await crypto.subtle.importKey(
      "raw",
      sharedSecret,
      "HKDF",
      false,
      ["deriveBits"]
    );

    const authInfo = new Uint8Array([
      ...new TextEncoder().encode("WebPush: info\0"),
      ...clientPublicKey,
      ...localPublicKeyBytes,
    ]);

    const ikm = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        salt: authSecret.buffer as ArrayBuffer,
        info: authInfo.buffer as ArrayBuffer,
        hash: "SHA-256",
      },
      sharedSecretKey,
      256
    );

    const ikmKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);

    const cekBits = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        salt: salt.buffer as ArrayBuffer,
        info: new TextEncoder().encode("Content-Encoding: aes128gcm\0"),
        hash: "SHA-256",
      },
      ikmKey,
      128
    );

    const nonce = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        salt: salt.buffer as ArrayBuffer,
        info: new TextEncoder().encode("Content-Encoding: nonce\0"),
        hash: "SHA-256",
      },
      ikmKey,
      96
    );

    const cek = await crypto.subtle.importKey("raw", cekBits, "AES-GCM", false, ["encrypt"]);

    // Prepare plaintext with delimiter
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const plaintext = new Uint8Array(payloadBytes.length + 1);
    plaintext.set(payloadBytes);
    plaintext[payloadBytes.length] = 2; // Delimiter

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: nonce,
        tagLength: 128,
      },
      cek,
      plaintext
    );

    // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65)
    const recordSize = 4096;
    const aes128gcmHeader = new Uint8Array(16 + 4 + 1 + 65);
    aes128gcmHeader.set(salt, 0);
    new DataView(aes128gcmHeader.buffer).setUint32(16, recordSize, false);
    aes128gcmHeader[20] = 65;
    aes128gcmHeader.set(localPublicKeyBytes, 21);

    // Combine header + ciphertext
    const body = new Uint8Array(aes128gcmHeader.length + ciphertext.byteLength);
    body.set(aes128gcmHeader);
    body.set(new Uint8Array(ciphertext), aes128gcmHeader.length);

    // Send request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "TTL": "86400",
        "Urgency": "high",
      },
      body: body,
    });

    if (response.ok || response.status === 201) {
      return { success: true, statusCode: response.status };
    } else {
      const errorText = await response.text();
      console.error(`[send-push] Failed for ${subscription.id}:`, response.status, errorText);
      return { success: false, error: errorText, statusCode: response.status };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[send-push] Error for ${subscription.id}:`, err);
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SendPushRequest = await req.json();
    console.log("[send-push] Request:", { test: body.test, user_id: body.user_id, title: body.title });

    const { data: config, error: configError } = await supabase
      .from("push_config")
      .select("*")
      .single();

    if (configError || !config?.is_configured) {
      console.error("[send-push] Config error:", configError);
      return new Response(
        JSON.stringify({ success: false, message: "Push notifications not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vapidPublicKey = config.vapid_public_key;
    const vapidPrivateKey = config.vapid_private_key_encrypted;
    const senderEmail = "contato@psicoavaliar.com.br";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ success: false, message: "VAPID keys not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let targetUserId: string | null = body.user_id || null;

    // In test mode, use the authenticated user's ID if no user_id was specified
    if (body.test && !targetUserId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          targetUserId = user.id;
          console.log("[send-push] Test mode for user:", targetUserId);
        }
      }
    }

    let subscriptionsQuery = supabase
      .from("push_subscriptions")
      .select("*")
      .is("revoked_at", null);

    if (targetUserId) {
      subscriptionsQuery = subscriptionsQuery.eq("user_id", targetUserId);
      console.log("[send-push] Filtering by user_id:", targetUserId);
    }

    const { data: subscriptions, error: subError } = await subscriptionsQuery;

    if (subError) {
      console.error("[send-push] Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ success: false, message: "Error fetching subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("[send-push] No subscriptions found");
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum dispositivo inscrito para receber notificações", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-push] Found", subscriptions.length, "subscriptions");

    const pushPayload: PushPayload = {
      title: body.title || config.sender_name,
      body: body.body,
      icon: "/logo-psicoavaliar.png",
      badge: "/logo-psicoavaliar.png",
      tag: body.event_key || "notification",
      data: {
        url: body.action_url,
        event_key: body.event_key,
      },
    };

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const result = await sendPushToSubscription(
          sub as PushSubscriptionData,
          pushPayload,
          vapidPublicKey,
          vapidPrivateKey,
          senderEmail
        );

        if (result.success) {
          await supabase
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", sub.id);
        }

        if (result.statusCode === 410 || result.statusCode === 404) {
          console.log("[send-push] Revoking invalid subscription:", sub.id);
          await supabase
            .from("push_subscriptions")
            .update({ revoked_at: new Date().toISOString() })
            .eq("id", sub.id);
        }

        return { id: sub.id, device: sub.device_label, ...result };
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    console.log("[send-push] Results:", { successful, total: subscriptions.length });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Push enviado para ${successful}/${subscriptions.length} dispositivos`,
        sent: successful,
        total: subscriptions.length,
        results: results.map((r) => r.status === "fulfilled" ? r.value : { success: false, error: "Promise rejected" }),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-push] Error:", err);
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
