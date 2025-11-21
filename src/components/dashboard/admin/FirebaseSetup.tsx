import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, ExternalLink, Settings } from "lucide-react";

export const FirebaseSetup = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Configuração do Firebase</CardTitle>
        </div>
        <CardDescription>
          Para que as notificações push funcionem, você precisa configurar o Firebase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Code className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Passos para configurar:</p>
              <ol className="list-decimal ml-5 space-y-2 text-sm">
                <li>
                  Crie um projeto no{" "}
                  <a 
                    href="https://console.firebase.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Firebase Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  Ative o Firebase Cloud Messaging (FCM) nas configurações do projeto
                </li>
                <li>
                  Nas configurações do projeto, copie suas credenciais (API Key, Project ID, etc.)
                </li>
                <li>
                  Edite o arquivo <code className="bg-muted px-1 py-0.5 rounded">src/lib/fcmService.ts</code> e substitua os valores placeholder pelas suas credenciais
                </li>
                <li>
                  Em Cloud Messaging → Web Push certificates, gere um par de chaves VAPID e adicione no arquivo
                </li>
                <li>
                  Nas configurações do Cloud Messaging, copie a Server Key e adicione como secret FIREBASE_SERVER_KEY
                </li>
              </ol>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-2">Exemplo de configuração em fcmService.ts:</p>
                <pre className="text-xs overflow-x-auto">
{`const FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};`}
                </pre>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            <strong>Importante:</strong> Sem configurar o Firebase, as notificações push não funcionarão. 
            As notificações in-app (dentro do sistema) continuarão funcionando normalmente.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
