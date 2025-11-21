import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Settings, ExternalLink } from "lucide-react";

export function ConfigureFirebase() {
  const [config, setConfig] = useState({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    vapidKey: ""
  });

  const handleSave = () => {
    // Validar se todos os campos estão preenchidos
    const allFilled = Object.values(config).every(value => value.trim() !== "");
    
    if (!allFilled) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Salvar no localStorage para uso no fcmService
    localStorage.setItem('firebase_config', JSON.stringify(config));
    toast.success("Configuração do Firebase salva! Recarregue a página para aplicar.");
  };

  const handleClear = () => {
    setConfig({
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      vapidKey: ""
    });
    localStorage.removeItem('firebase_config');
    toast.success("Configuração limpa");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurar Firebase Cloud Messaging
        </CardTitle>
        <CardDescription>
          Configure suas credenciais do Firebase para habilitar notificações push
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Como obter as credenciais:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Acesse o{" "}
                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Firebase Console
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Crie um projeto ou selecione um existente</li>
                <li>Vá em Configurações do Projeto (⚙️) → Geral</li>
                <li>Role até "Seus apps" e clique no ícone Web (&lt;/&gt;)</li>
                <li>Copie as credenciais do Firebase Config</li>
                <li>Em "Cloud Messaging" → "Web Push certificates", gere um par de chaves VAPID</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              value={config.apiKey}
              onChange={(e) => setConfig({...config, apiKey: e.target.value})}
              placeholder="AIzaSy..."
            />
          </div>

          <div>
            <Label htmlFor="authDomain">Auth Domain</Label>
            <Input
              id="authDomain"
              value={config.authDomain}
              onChange={(e) => setConfig({...config, authDomain: e.target.value})}
              placeholder="seu-projeto.firebaseapp.com"
            />
          </div>

          <div>
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              value={config.projectId}
              onChange={(e) => setConfig({...config, projectId: e.target.value})}
              placeholder="seu-projeto"
            />
          </div>

          <div>
            <Label htmlFor="storageBucket">Storage Bucket</Label>
            <Input
              id="storageBucket"
              value={config.storageBucket}
              onChange={(e) => setConfig({...config, storageBucket: e.target.value})}
              placeholder="seu-projeto.appspot.com"
            />
          </div>

          <div>
            <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
            <Input
              id="messagingSenderId"
              value={config.messagingSenderId}
              onChange={(e) => setConfig({...config, messagingSenderId: e.target.value})}
              placeholder="123456789"
            />
          </div>

          <div>
            <Label htmlFor="appId">App ID</Label>
            <Input
              id="appId"
              value={config.appId}
              onChange={(e) => setConfig({...config, appId: e.target.value})}
              placeholder="1:123456789:web:abc123"
            />
          </div>

          <div>
            <Label htmlFor="vapidKey">VAPID Key (Web Push Certificate)</Label>
            <Input
              id="vapidKey"
              value={config.vapidKey}
              onChange={(e) => setConfig({...config, vapidKey: e.target.value})}
              placeholder="BNxxx..."
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Salvar Configuração
          </Button>
          <Button onClick={handleClear} variant="outline">
            Limpar
          </Button>
        </div>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-800">
            <strong>Importante:</strong> Após salvar, recarregue a página para que as notificações push funcionem corretamente.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
