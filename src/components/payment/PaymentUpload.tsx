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

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${pagamentoId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("comprovantes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("comprovantes")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("pagamentos")
        .update({
          comprovante_url: publicUrl,
          status: "pago",
          data_pagamento: new Date().toISOString(),
        })
        .eq("id", pagamentoId);

      if (updateError) throw updateError;

      toast({
        title: "Comprovante enviado!",
        description: "Seu pagamento foi registrado com sucesso.",
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
