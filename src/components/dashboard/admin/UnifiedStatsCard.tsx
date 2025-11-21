import { Card } from "@/components/ui/card";
import { Calendar, Users, DollarSign } from "lucide-react";

interface UnifiedStatsCardProps {
  stats: {
    totalFeiras: number;
    feirasAtivas: number;
    totalFeirantes: number;
    participacoesConfirmadas: number;
    pagamentosPendentes: number;
    pagamentosRecebidos: number;
  };
}

export const UnifiedStatsCard = ({ stats }: UnifiedStatsCardProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Resumo do Sistema</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Total de Feiras */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium">Total de Feiras</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalFeiras}</p>
        </div>

        {/* Feiras Ativas */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium">Feiras Ativas</span>
          </div>
          <p className="text-2xl font-bold">{stats.feirasAtivas}</p>
        </div>

        {/* Feirantes Cadastrados */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium">Feirantes Cadastrados</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalFeirantes}</p>
        </div>

        {/* Participações Confirmadas */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs font-medium">Participações Confirmadas</span>
          </div>
          <p className="text-2xl font-bold">{stats.participacoesConfirmadas}</p>
        </div>

        {/* Pagamentos Pendentes */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium">Pagamentos Pendentes</span>
          </div>
          <p className="text-lg font-bold">
            R$ {stats.pagamentosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Pagamentos Recebidos */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 border border-teal-200 dark:border-teal-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-xs font-medium">Pagamentos Recebidos</span>
          </div>
          <p className="text-lg font-bold">
            R$ {stats.pagamentosRecebidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </Card>
  );
};
