import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Send, Loader2, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Feirante {
  id: string;
  user_id: string;
  profile: {
    full_name: string;
  };
}

const SendNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [feirantes, setFeirantes] = useState<Feirante[]>([]);
  const [selectedFeirantes, setSelectedFeirantes] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFeirantes, setLoadingFeirantes] = useState(true);

  useEffect(() => {
    loadFeirantes();
  }, []);

  useEffect(() => {
    if (selectAll) {
      setSelectedFeirantes(feirantes.map(f => f.user_id));
    } else {
      setSelectedFeirantes([]);
    }
  }, [selectAll, feirantes]);

  const loadFeirantes = async () => {
    try {
      const { data, error } = await supabase
        .from("feirantes")
        .select(`
          id,
          user_id,
          profile:profiles(full_name)
        `)
        .eq("bloqueado", false)
        .order("profile(full_name)");

      if (error) throw error;
      setFeirantes(data as any || []);
    } catch (error) {
      console.error("Erro ao carregar feirantes:", error);
      toast.error("Erro ao carregar lista de feirantes");
    } finally {
      setLoadingFeirantes(false);
    }
  };

  const handleToggleFeirante = (userId: string) => {
    setSelectedFeirantes(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendNotifications = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Preencha o título e a mensagem");
      return;
    }

    if (selectedFeirantes.length === 0) {
      toast.error("Selecione pelo menos um feirante");
      return;
    }

    setLoading(true);
    try {
      const notifications = selectedFeirantes.map(userId => ({
        user_id: userId,
        title: title.trim(),
        message: message.trim(),
        type: "admin_broadcast",
        read: false
      }));

      const { error } = await supabase
        .from("notifications")
        .insert(notifications);

      if (error) throw error;

      toast.success(`Notificação enviada para ${selectedFeirantes.length} feirante(s)!`);
      setTitle("");
      setMessage("");
      setSelectedFeirantes([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
      toast.error("Erro ao enviar notificações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Enviar Notificações</h1>
        <p className="text-muted-foreground">Envie mensagens para os feirantes cadastrados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Criar Notificação
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ex: Atenção feirantes!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{title.length}/100 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite a mensagem que deseja enviar aos feirantes..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{message.length}/500 caracteres</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                {selectedFeirantes.length} feirante(s) selecionado(s)
              </div>
              <Button 
                onClick={handleSendNotifications}
                disabled={loading || !title.trim() || !message.trim() || selectedFeirantes.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Notificação
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Selecionar Destinatários
          </h2>

          {loadingFeirantes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : feirantes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum feirante ativo encontrado
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={(checked) => setSelectAll(checked as boolean)}
                />
                <Label htmlFor="select-all" className="font-semibold cursor-pointer">
                  Selecionar todos ({feirantes.length})
                </Label>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {feirantes.map((feirante) => (
                    <div
                      key={feirante.user_id}
                      className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={feirante.user_id}
                        checked={selectedFeirantes.includes(feirante.user_id)}
                        onCheckedChange={() => handleToggleFeirante(feirante.user_id)}
                      />
                      <Label htmlFor={feirante.user_id} className="flex-1 cursor-pointer">
                        {feirante.profile?.full_name || "Nome não disponível"}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SendNotifications;
