# Configuração do Firebase para Notificações Push

## ⚠️ IMPORTANTE
Para que as notificações push funcionem no celular, você PRECISA configurar suas próprias credenciais do Firebase.

## Passo 1: Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com
2. Clique em "Adicionar projeto"
3. Dê um nome ao seu projeto (ex: "FeiraFacil")
4. Siga os passos até concluir a criação

## Passo 2: Adicionar App Web

1. No console do Firebase, clique no ícone Web (`</>`)
2. Dê um nome ao app (ex: "FeiraFacil Web")
3. Marque a opção "Firebase Hosting" se desejar
4. Clique em "Registrar app"

## Passo 3: Copiar Credenciais

Você verá um código JavaScript com as credenciais:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123"
};
```

**COPIE ESSAS INFORMAÇÕES!**

## Passo 4: Gerar VAPID Key

1. No Firebase Console, vá em: **Configurações do Projeto** (⚙️) → **Cloud Messaging**
2. Role até "Web Push certificates"
3. Clique em **"Gerar par de chaves"**
4. Copie a chave gerada (começa com `BN...`)

## Passo 5: Editar o Código

Abra o arquivo `src/lib/fcmService.ts` e substitua as credenciais:

```typescript
const FIREBASE_CONFIG = {
  apiKey: "COLE_SEU_API_KEY_AQUI",
  authDomain: "COLE_SEU_AUTH_DOMAIN_AQUI",
  projectId: "COLE_SEU_PROJECT_ID_AQUI",
  storageBucket: "COLE_SEU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "COLE_SEU_MESSAGING_SENDER_ID_AQUI",
  appId: "COLE_SEU_APP_ID_AQUI"
};

const VAPID_KEY = "COLE_SUA_VAPID_KEY_AQUI";
```

## Passo 6: Configurar Server Key (Backend)

1. No Firebase Console, em **Cloud Messaging**
2. Copie a **"Chave do servidor"** (Server Key)
3. No dashboard do seu app, vá em **Configurações → Secrets**
4. Adicione um secret chamado `FIREBASE_SERVER_KEY` com o valor da chave do servidor

## Testando

1. Faça login no app (como admin ou feirante)
2. Permita notificações quando solicitado
3. O sistema automaticamente registrará o dispositivo
4. Envie uma notificação teste pelo dashboard admin
5. A notificação deve aparecer no celular mesmo com o app fechado! 🎉

## Problemas Comuns

### "Firebase não configurado"
- Verifique se editou o arquivo `src/lib/fcmService.ts`
- Certifique-se de que copiou TODAS as credenciais corretamente

### "Permissão negada"
- No navegador, vá em Configurações → Notificações
- Permita notificações para o site

### Notificação não chega no celular
- Verifique se o `FIREBASE_SERVER_KEY` está configurado nos secrets
- Veja os logs da edge function `send-push-notification`
- Certifique-se de que o dispositivo está registrado (veja no dashboard)

## Suporte

Em caso de dúvidas:
- WhatsApp: (62) 99142-9264
- Email: suporte@feirafacil.com
