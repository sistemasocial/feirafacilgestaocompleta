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

// Gera um access token OAuth 2.0 para o Firebase Messaging usando o service account
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const unsignedToken = `${header}.${encodedPayload}`;

  const privateKeyPem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(privateKeyPem), (c) => c.charCodeAt(0));

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

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${unsignedToken}.${signatureBase64}`;

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
    console.log('=== Início do envio de notificação (v1 FCM) ===');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const firebaseServiceAccount = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

    console.log('Variáveis de ambiente (send-push-notification):', {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      firebaseServiceAccount: !!firebaseServiceAccount,
    });

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Backend não configurado corretamente (SUPABASE_URL/SERVICE_ROLE_KEY ausentes)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = (await req.json()) as NotificationPayload;
    const { title, message, userId, userIds, type, relatedId } = body;

    console.log('Payload recebido:', body);

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
      console.error('Erro ao buscar tokens FCM:', tokensError);
      throw tokensError;
    }

    console.log(`[FCM] Tokens encontrados (incluindo possíveis duplicados): ${tokens?.length || 0}`);

    // Remover tokens duplicados para evitar notificações em duplicidade
    const uniqueTokens = Array.from(new Set((tokens || []).map((t) => t.token)));
    console.log(`[FCM] Tokens únicos para envio: ${uniqueTokens.length}`);

    // Criar notificações no banco (para o sininho e histórico)
    const notifications = targetUserIds.map((uid) => ({
      user_id: uid,
      title,
      message,
      type: type || 'geral',
      related_id: relatedId,
      read: false,
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Erro ao criar notificações no banco:', notifError);
    }

    // Se não houver tokens ou Firebase não configurado, apenas registra no banco
    if (!tokens || tokens.length === 0 || !firebaseServiceAccount) {
      if (!firebaseServiceAccount) {
        console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT não configurado, pulando envio push');
      }

      return new Response(
        JSON.stringify({
          message: 'Notificações criadas no banco, mas push não enviado',
          notificationsCreated: targetUserIds.length,
          pushSent: false,
          tokens: tokens?.length || 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter access token OAuth para o FCM v1
    let accessToken: string;
    try {
      accessToken = await getAccessToken(firebaseServiceAccount);
      console.log('[FCM] ✓ Access token obtido com sucesso');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[FCM] Erro ao obter access token:', errorMsg);
      return new Response(
        JSON.stringify({
          message: 'Notificações criadas no banco, mas falha ao autenticar no Firebase',
          error: errorMsg,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceAccount = JSON.parse(firebaseServiceAccount);
    const projectId = serviceAccount.project_id;

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'project_id ausente no FIREBASE_SERVICE_ACCOUNT' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[FCM] Enviando via endpoint v1:', `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`);

    const pushPromises = uniqueTokens.map(async (token) => {
      try {
        console.log('[FCM] Enviando para token:', token.substring(0, 25) + '...');

        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token,
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
          const text = await response.text();
          console.error('[FCM] Erro HTTP ao enviar push:', response.status, response.statusText);
          console.error('[FCM] Corpo da resposta:', text);

          // Limpar tokens inválidos do banco automaticamente
          if (response.status === 404 || response.status === 403) {
            console.log('[FCM] Removendo token inválido do banco:', token.substring(0, 25) + '...');
            try {
              await supabase.from('fcm_tokens').delete().eq('token', token);
              console.log('[FCM] ✓ Token inválido removido');
            } catch (deleteError) {
              console.error('[FCM] Erro ao remover token:', deleteError);
            }
          }

          return { error: `HTTP ${response.status}`, token };
        }

        const result = await response.json();
        console.log('[FCM] ✓ Push enviado com sucesso:', result.name || 'sem id');
        return { success: true, token };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('[FCM] Exceção ao enviar push:', errorMsg);
        return { error: errorMsg, token };
      }
    });

    const results = await Promise.all(pushPromises);
    const successCount = results.filter((r) => (r as any).success).length;
    const failureCount = results.filter((r) => (r as any).error).length;

    console.log(`[FCM] Resumo envio push: ${successCount} sucesso(s), ${failureCount} falha(s)`);

    return new Response(
      JSON.stringify({
        message: 'Notificações processadas',
        sent: successCount,
        failed: failureCount,
        total: uniqueTokens.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[FCM] Erro geral na função send-push-notification:', errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
