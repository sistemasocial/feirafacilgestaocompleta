import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentUploadProps {
  pagamentoId: string;
  status: string;
  valorTotal: number;
  onUploadComplete: () => void;
}

export default function PaymentUpload({
  pagamentoId,
  status,
  valorTotal,
  onUploadComplete,
}: PaymentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleComprovanteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "Tamanho máximo: 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type using MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não permitido",
        description: "Apenas imagens (JPG, PNG) ou PDF são aceitos",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get current user ID for folder organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Sanitize filename using MIME type
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'application/pdf': 'pdf'
      };
      const safeExt = mimeToExt[file.type] || 'bin';
      const fileName = `${user.id}/${pagamentoId}-${Date.now()}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from("comprovantes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update payment status to awaiting verification (not paid yet!)
      const { error: updateError } = await supabase
        .from("pagamentos")
        .update({
          comprovante_feirante_url: fileName,
          status: "aguardando_verificacao",
          data_upload: new Date().toISOString(),
        })
        .eq("id", pagamentoId);

      if (updateError) throw updateError;

      toast({
        title: "Comprovante enviado!",
        description: "Aguardando verificação do administrador.",
      });

      onUploadComplete();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar comprovante",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "pago":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-4 h-4 mr-1" />
            Pago
          </Badge>
        );
      case "aguardando_verificacao":
        return (
          <Badge variant="default" className="bg-yellow-500">
            <Clock className="w-4 h-4 mr-1" />
            Aguardando Verificação
          </Badge>
        );
      case "pendente":
        return (
          <Badge variant="secondary">
            <Clock className="w-4 h-4 mr-1" />
            Pendente
          </Badge>
        );
      case "atrasado":
        return (
          <Badge variant="destructive">
            <Clock className="w-4 h-4 mr-1" />
            Atrasado
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/15 via-primary/10 to-accent/15 border-2 border-primary/30 shadow-lg p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground">Pagamento</h3>
          {getStatusBadge()}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-base">
            <span className="font-medium text-foreground/80">Valor total:</span>
            <span className="font-bold text-lg text-primary">
              {valorTotal > 0 ? `R$ ${valorTotal.toFixed(2)}` : "Gratuito"}
            </span>
          </div>
        </div>

        {status !== "pago" && valorTotal > 0 && (
          <div className="space-y-4 pt-4 border-t-2 border-primary/20">
            <Label className="text-base font-semibold text-foreground">Enviar Comprovante de Pagamento</Label>
            <Label htmlFor="comprovante-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="default"
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-5 h-5 mr-2" />
                  )}
                  {uploading ? "Enviando..." : "Selecionar Comprovante"}
                </span>
              </Button>
            </Label>
            <Input
              id="comprovante-upload"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleComprovanteUpload}
              disabled={uploading}
            />
            <p className="text-sm text-foreground/70 font-medium text-center">
              Aceito: Imagens (JPG, PNG) ou PDF
            </p>
          </div>
        )}

        {status === "pago" && (
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/40 rounded-xl text-center py-6 shadow-inner">
            <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-600" />
            <p className="font-bold text-lg text-green-700">Pagamento confirmado!</p>
            <p className="text-sm text-green-600 mt-1">Sua participação está garantida</p>
          </div>
        )}
      </div>
    </Card>
  );
}
