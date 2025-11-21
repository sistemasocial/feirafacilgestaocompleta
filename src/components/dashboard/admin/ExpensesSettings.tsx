import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string;
  description: string;
  amount: number;
}

interface ExpensesSettingsProps {
  userId: string;
}

export const ExpensesSettings = ({ userId }: ExpensesSettingsProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({ description: "", amount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [userId]);

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_expenses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }) as any;

      if (error) throw error;

      if (data) {
        setExpenses(data as Expense[]);
      }
    } catch (error: any) {
      console.error("Erro ao carregar despesas:", error);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description.trim() || newExpense.amount <= 0) {
      toast.error("Preencha descrição e valor válido");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("admin_expenses")
        .insert({
          user_id: userId,
          description: newExpense.description,
          amount: newExpense.amount,
        } as any);

      if (error) throw error;

      toast.success("Despesa adicionada!");
      setNewExpense({ description: "", amount: 0 });
      loadExpenses();
    } catch (error: any) {
      toast.error("Erro ao adicionar despesa: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from("admin_expenses")
        .delete()
        .eq("id", id) as any;

      if (error) throw error;

      toast.success("Despesa removida!");
      loadExpenses();
    } catch (error: any) {
      toast.error("Erro ao remover despesa: " + error.message);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <Card className="h-full p-6 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-pink-500/5 border-border flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Minhas Despesas</h3>
          <p className="text-sm text-muted-foreground">Controle suas despesas mensais</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Total */}
        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
          <p className="text-sm text-muted-foreground mb-1">Total de Despesas</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Lista de despesas */}
        {expenses.length > 0 && (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                <div className="flex-1">
                  <p className="text-sm font-medium">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteExpense(expense.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Nova despesa */}
        <div className="space-y-3 pt-4 border-t">
          <div>
            <Label htmlFor="expense-description">Descrição</Label>
            <Input
              id="expense-description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="Ex: Aluguel, Água, Luz..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="expense-amount">Valor (R$)</Label>
            <Input
              id="expense-amount"
              type="number"
              value={newExpense.amount || ""}
              onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
              min={0}
              step={0.01}
              placeholder="0,00"
              className="mt-1"
            />
          </div>

          <Button onClick={handleAddExpense} disabled={loading} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {loading ? "Adicionando..." : "Adicionar Despesa"}
          </Button>
        </div>
      </div>
    </Card>
  );
};