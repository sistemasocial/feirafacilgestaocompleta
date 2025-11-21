import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface FinancialGoalsCardProps {
  userId: string;
  onGoalUpdated: () => void;
}

export const FinancialGoalsCard = ({ userId, onGoalUpdated }: FinancialGoalsCardProps) => {
  const [revenueGoal, setRevenueGoal] = useState<number>(10000);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadSettings();
    loadExpenses();
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

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_expenses")
        .select("amount")
        .eq("user_id", userId) as any;

      if (error) throw error;

      if (data) {
        const total = data.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
        setTotalExpenses(total);
      }
    } catch (error: any) {
      console.error("Erro ao carregar despesas:", error);
    }
  };

  const handleSaveRevenue = async () => {
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
      setIsEditing(false);
      onGoalUpdated();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const lucroLiquido = revenueGoal - totalExpenses;
  const margemLucro = revenueGoal > 0 ? ((lucroLiquido / revenueGoal) * 100).toFixed(1) : 0;

  return (
    <Card className="h-full p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Metas Financeiras</h3>
            <p className="text-sm text-muted-foreground">Receita e despesas mensais</p>
          </div>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Editar
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Meta de Receita */}
        <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">Meta de Receita</p>
          </div>
          {isEditing ? (
            <Input
              type="number"
              value={revenueGoal}
              onChange={(e) => setRevenueGoal(Number(e.target.value))}
              min={0}
              step={100}
              className="text-xl font-bold"
            />
          ) : (
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              R$ {revenueGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Total Despesas */}
        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            <p className="text-sm font-medium text-orange-700">Total de Despesas</p>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => {
                // Navigate to expenses management
                window.location.hash = '#expenses';
              }}
            >
              Gerenciar
            </Button>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className={`p-4 rounded-lg border ${
          lucroLiquido >= 0 
            ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20' 
            : 'bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20'
        }`}>
          <p className="text-sm text-muted-foreground mb-1">Lucro Líquido Estimado</p>
          <div className="flex items-baseline justify-between">
            <p className={`text-2xl font-bold ${
              lucroLiquido >= 0 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent'
            }`}>
              R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className={`text-sm font-semibold ${
              lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {margemLucro}% margem
            </span>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveRevenue} disabled={loading} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                loadSettings();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};