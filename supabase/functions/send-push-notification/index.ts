import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  message: string;
  userId?: string;
  userIds?: string[];
  type?: string;
  relatedId?: string;
}

// Função para obter access token OAuth 2.0
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Criar JWT para autenticação
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  // Encode header e payload
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const unsignedToken = `${header}.${encodedPayload}`;

  // Preparar chave privada
  const privateKeyPem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  // Decodificar base64 para ArrayBuffer
  const binaryKey = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));

  // Importar chave privada
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Assinar o token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Converter signature para base64url
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${unsignedToken}.${signatureBase64}`;

  // Trocar JWT por access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Erro ao obter access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Início do envio de notificação ===');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firebaseServiceAccount = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

    console.log('Variáveis:', {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      firebaseServiceAccount: !!firebaseServiceAccount
    });

    if (!firebaseServiceAccount) {
      console.warn('FIREBASE_SERVICE_ACCOUNT não configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { title, message, userId, userIds, type, relatedId }: NotificationPayload = body;

    console.log('Payload:', { title, message, userId, userIds, type });

    // Determinar usuários alvo
    let targetUserIds: string[] = [];
    if (userId) {
      targetUserIds = [userId];
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return new Response(
        JSON.stringify({ error: 'userId ou userIds obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar tokens FCM
    const { data: tokens, error: tokensError } = await supabase
      .from('fcm_tokens')
      .select('token, user_id')
      .in('user_id', targetUserIds);

    if (tokensError) {
      console.error('Erro ao buscar tokens:', tokensError);
      throw tokensError;
    }

    console.log(`Tokens encontrados: ${tokens?.length || 0}`);

    // Criar notificações no banco
    const notifications = targetUserIds.map(uid => ({
      user_id: uid,
      title,
      message,
      type: type || 'geral',
      related_id: relatedId,
      read: false
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Erro ao criar notificações:', notifError);
    }

    // Se não houver tokens ou Firebase não configurado
    if (!tokens || tokens.length === 0 || !firebaseServiceAccount) {
      return new Response(
        JSON.stringify({
          message: 'Notificações criadas no banco',
          notificationsCreated: targetUserIds.length,
          pushSent: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken(firebaseServiceAccount);
      console.log('✓ Access token obtido');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro OAuth:', error);
      return new Response(
        JSON.stringify({
          message: 'Notificações criadas, mas falha no envio push',
          error: errorMsg
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar push notifications
    const serviceAccount = JSON.parse(firebaseServiceAccount);
    const projectId = serviceAccount.project_id;

    const pushPromises = tokens.map(async ({ token }) => {
      try {
        console.log('[Push] Enviando:', token.substring(0, 20) + '...');

        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token: token,
                notification: {
                  title,
                  body: message,
                },
                data: {
                  type: type || 'geral',
                  relatedId: relatedId || '',
                },
                android: {
                  priority: 'high',
                  notification: {
                    sound: 'default',
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                  },
                },
                webpush: {
                  notification: {
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    requireInteraction: true,
                    vibrate: [200, 100, 200],
                  },
                  fcm_options: {
                    link: '/dashboard',
                  },
                },
              },
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.error('[Push] Erro:', response.status, error);
          return { error: `HTTP ${response.status}` };
        }

        const result = await response.json();
        console.log('[Push] ✓ Sucesso');
        return { success: true };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('[Push] Exceção:', error);
        return { error: errorMsg };
      }
    });

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => r.error).length;

    console.log(`[Push] Resumo: ${successCount} enviadas, ${failureCount} falharam`);

    return new Response(
      JSON.stringify({
        message: 'Notificações processadas',
        sent: successCount,
        failed: failureCount,
        total: tokens.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
