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
    const firebaseServerKey = Deno.env.get('FIREBASE_SERVER_KEY');

    console.log('Variáveis de ambiente:', {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      firebaseServerKey: !!firebaseServerKey
    });

    if (!firebaseServerKey) {
      console.warn('FIREBASE_SERVER_KEY não configurada - notificações push não serão enviadas');
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

    // Se não houver FIREBASE_SERVER_KEY, retornar apenas com as notificações criadas
    if (!firebaseServerKey) {
      return new Response(
        JSON.stringify({
          message: 'Notificações criadas no banco (Firebase não configurado)',
          notificationsCreated: targetUserIds.length
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar notificação push via Firebase para cada token
    const pushPromises = tokens.map(async ({ token }) => {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${firebaseServerKey}`,
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title,
              body: message,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
            },
            data: {
              type: type || 'geral',
              relatedId: relatedId || '',
              url: '/dashboard',
            },
          }),
        });

        const result = await response.json();
        console.log('Resposta Firebase:', result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Erro ao enviar para token:', token, error);
        return { error: errorMessage };
      }
    });

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(r => r.success !== undefined ? r.success >= 1 : !r.error).length;

    return new Response(
      JSON.stringify({
        message: 'Notificações enviadas',
        sent: successCount,
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
