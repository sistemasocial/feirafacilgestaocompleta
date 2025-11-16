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
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pagamento</h3>
          {getStatusBadge()}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor total:</span>
            <span className="font-semibold">
              {valorTotal > 0 ? `R$ ${valorTotal.toFixed(2)}` : "Gratuito"}
            </span>
          </div>
        </div>

        {status !== "pago" && valorTotal > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <Label>Enviar Comprovante de Pagamento</Label>
            <Label htmlFor="comprovante-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
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
            <p className="text-xs text-muted-foreground">
              Aceito: Imagens (JPG, PNG) ou PDF
            </p>
          </div>
        )}

        {status === "pago" && (
          <div className="text-center text-green-600 py-4">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="font-medium">Pagamento confirmado!</p>
          </div>
        )}
      </div>
    </Card>
  );
}
