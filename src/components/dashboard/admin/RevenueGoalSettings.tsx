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
    <Card className="p-6 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Meta de Receita</h3>
          <p className="text-sm text-muted-foreground">Defina sua meta mensal</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/20">
          <p className="text-sm text-muted-foreground mb-1">Meta Mensal</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            R$ {revenueGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div>
          <Label htmlFor="revenue-goal">Valor da Meta (R$)</Label>
          <Input
            id="revenue-goal"
            type="number"
            value={revenueGoal}
            onChange={(e) => setRevenueGoal(Number(e.target.value))}
            min={0}
            step={100}
            className="mt-2"
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Meta"}
        </Button>
      </div>
    </Card>
  );
};
