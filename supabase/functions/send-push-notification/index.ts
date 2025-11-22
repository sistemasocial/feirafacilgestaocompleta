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

Deno.serve(async (req) => {
  // Sempre retornar CORS headers em todas as respostas
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Início do envio de notificação ===');
    console.log('Método:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firebaseServiceAccount = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

    console.log('Variáveis de ambiente:', {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      firebaseServiceAccount: !!firebaseServiceAccount
    });

    if (!firebaseServiceAccount) {
      console.warn('FIREBASE_SERVICE_ACCOUNT não configurado - notificações push não serão enviadas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Body recebido:', body);

    const { title, message, userId, userIds, type, relatedId }: NotificationPayload = body;

    console.log('Enviando notificação push:', { title, message, userId, userIds, type });

    // Determinar quais usuários receberão a notificação
    let targetUserIds: string[] = [];
    if (userId) {
      targetUserIds = [userId];
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return new Response(
        JSON.stringify({ error: 'userId ou userIds são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar tokens FCM dos usuários
    const { data: tokens, error: tokensError } = await supabase
      .from('fcm_tokens')
      .select('token, user_id')
      .in('user_id', targetUserIds);

    if (tokensError) {
      console.error('Erro ao buscar tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('Nenhum token FCM encontrado para os usuários');
      
      // Mesmo sem tokens FCM, criar notificações no banco
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

      return new Response(
        JSON.stringify({ 
          message: 'Notificações criadas no banco, mas nenhum dispositivo registrado para push',
          notificationsCreated: targetUserIds.length
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontrados ${tokens.length} tokens FCM`);

    // Criar notificação no banco para cada usuário
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

    // Se não houver FIREBASE_SERVICE_ACCOUNT, retornar apenas com as notificações criadas
    if (!firebaseServiceAccount) {
      return new Response(
        JSON.stringify({
          message: 'Notificações criadas no banco (Firebase não configurado)',
          notificationsCreated: targetUserIds.length
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse service account
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(firebaseServiceAccount);
    } catch (error) {
      console.error('Erro ao fazer parse do service account:', error);
      return new Response(
        JSON.stringify({ error: 'Service account JSON inválido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter access token OAuth 2.0
    const getAccessToken = async () => {
      const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const now = Math.floor(Date.now() / 1000);
      const jwtClaimSet = btoa(JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      }));

      const signatureInput = `${jwtHeader}.${jwtClaimSet}`;
      
      // Import private key
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        new TextEncoder().encode(serviceAccount.private_key),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(signatureInput)
      );

      const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
      });

      const tokenData = await tokenResponse.json();
      return tokenData.access_token;
    };

    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      console.error('Erro ao obter access token:', error);
      return new Response(
        JSON.stringify({ error: 'Falha na autenticação OAuth 2.0' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar notificação push via Firebase FCM v1 API para cada token
    const pushPromises = tokens.map(async ({ token }) => {
      try {
        console.log('[Push] Enviando para token:', token.substring(0, 20) + '...');
        
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
        
        const response = await fetch(fcmUrl, {
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
                title,
                message,
              },
              android: {
                priority: 'high',
                notification: {
                  icon: '/pwa-192x192.png',
                  click_action: 'https://f890b9d8-fa05-428f-8739-0ccf652f8fd7.lovableproject.com/dashboard',
                },
              },
              webpush: {
                notification: {
                  icon: '/pwa-192x192.png',
                  badge: '/pwa-192x192.png',
                },
                fcm_options: {
                  link: 'https://f890b9d8-fa05-428f-8739-0ccf652f8fd7.lovableproject.com/dashboard',
                },
              },
            },
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error('[Push] Erro HTTP:', response.status, text);
          return { error: `HTTP ${response.status}: ${text.substring(0, 200)}` };
        }

        const result = await response.json();
        console.log('[Push] ✓ Enviado com sucesso:', result);
        return { success: true, result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Push] Erro ao enviar:', error);
        return { error: errorMessage };
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
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Erro ao enviar notificação:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
