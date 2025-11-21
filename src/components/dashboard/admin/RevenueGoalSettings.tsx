import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

interface RevenueGoalSettingsProps {
  userId: string;
  onGoalUpdated: () => void;
}

export const RevenueGoalSettings = ({ userId, onGoalUpdated }: RevenueGoalSettingsProps) => {
  const [revenueGoal, setRevenueGoal] = useState<number>(10000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("revenue_goal")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRevenueGoal(data.revenue_goal || 10000);
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          user_id: userId,
          revenue_goal: revenueGoal,
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      toast.success("Meta de receita atualizada!");
      onGoalUpdated();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configurar Meta de Receita</h3>
          <p className="text-sm text-muted-foreground">Defina sua meta mensal de receita</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="revenue-goal">Meta de Receita (R$)</Label>
          <Input
            id="revenue-goal"
            type="number"
            value={revenueGoal}
            onChange={(e) => setRevenueGoal(Number(e.target.value))}
            min={0}
            step={100}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Valor: R$ {revenueGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Meta"}
        </Button>
      </div>
    </Card>
  );
};
