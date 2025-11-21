export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          id: string
          revenue_goal: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          revenue_goal?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          revenue_goal?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_installs: {
        Row: {
          id: string
          installed_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          installed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          installed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          avaliacao: number | null
          comentario: string | null
          created_at: string
          data_feira: string
          feira_id: string
          feirante_id: string
          id: string
        }
        Insert: {
          avaliacao?: number | null
          comentario?: string | null
          created_at?: string
          data_feira: string
          feira_id: string
          feirante_id: string
          id?: string
        }
        Update: {
          avaliacao?: number | null
          comentario?: string | null
          created_at?: string
          data_feira?: string
          feira_id?: string
          feirante_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_feira_id_fkey"
            columns: ["feira_id"]
            isOneToOne: false
            referencedRelation: "feiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "admin_feirante_contact"
            referencedColumns: ["feirante_id"]
          },
          {
            foreignKeyName: "avaliacoes_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "feirantes"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          created_at: string | null
          device_info: string | null
          id: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feirantes: {
        Row: {
          bloqueado: boolean | null
          cpf_cnpj: string
          created_at: string
          descricao: string | null
          fotos_url: string[] | null
          id: string
          motivo_bloqueio: string | null
          ponto_fixo: boolean | null
          segmento: Database["public"]["Enums"]["feirante_segment"]
          tamanho_barraca: string | null
          ticket_medio: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bloqueado?: boolean | null
          cpf_cnpj: string
          created_at?: string
          descricao?: string | null
          fotos_url?: string[] | null
          id?: string
          motivo_bloqueio?: string | null
          ponto_fixo?: boolean | null
          segmento: Database["public"]["Enums"]["feirante_segment"]
          tamanho_barraca?: string | null
          ticket_medio?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bloqueado?: boolean | null
          cpf_cnpj?: string
          created_at?: string
          descricao?: string | null
          fotos_url?: string[] | null
          id?: string
          motivo_bloqueio?: string | null
          ponto_fixo?: boolean | null
          segmento?: Database["public"]["Enums"]["feirante_segment"]
          tamanho_barraca?: string | null
          ticket_medio?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feiras: {
        Row: {
          avisos: string | null
          bairro: string
          cidade: string
          created_at: string
          created_by: string | null
          dias_semana: string[]
          endereco: string
          formas_pagamento: string[]
          horario_fim: string
          horario_inicio: string
          horario_limite_montagem: string
          horas_cancelamento_sem_multa: number | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          observacoes: string | null
          politica_cancelamento: string | null
          prazo_pagamento_dias: number | null
          recorrente: boolean | null
          regras_evento: string | null
          segmento_exclusivo: boolean | null
          taxa_cancelamento: number | null
          taxa_energia: number | null
          taxa_limpeza: number | null
          taxa_seguranca: number | null
          tempo_antecedencia_minutos: number
          tipo_feira: string
          updated_at: string
          valor_participacao: number | null
        }
        Insert: {
          avisos?: string | null
          bairro?: string
          cidade?: string
          created_at?: string
          created_by?: string | null
          dias_semana: string[]
          endereco: string
          formas_pagamento?: string[]
          horario_fim: string
          horario_inicio: string
          horario_limite_montagem: string
          horas_cancelamento_sem_multa?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          observacoes?: string | null
          politica_cancelamento?: string | null
          prazo_pagamento_dias?: number | null
          recorrente?: boolean | null
          regras_evento?: string | null
          segmento_exclusivo?: boolean | null
          taxa_cancelamento?: number | null
          taxa_energia?: number | null
          taxa_limpeza?: number | null
          taxa_seguranca?: number | null
          tempo_antecedencia_minutos?: number
          tipo_feira?: string
          updated_at?: string
          valor_participacao?: number | null
        }
        Update: {
          avisos?: string | null
          bairro?: string
          cidade?: string
          created_at?: string
          created_by?: string | null
          dias_semana?: string[]
          endereco?: string
          formas_pagamento?: string[]
          horario_fim?: string
          horario_inicio?: string
          horario_limite_montagem?: string
          horas_cancelamento_sem_multa?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          observacoes?: string | null
          politica_cancelamento?: string | null
          prazo_pagamento_dias?: number | null
          recorrente?: boolean | null
          regras_evento?: string | null
          segmento_exclusivo?: boolean | null
          taxa_cancelamento?: number | null
          taxa_energia?: number | null
          taxa_limpeza?: number | null
          taxa_seguranca?: number | null
          tempo_antecedencia_minutos?: number
          tipo_feira?: string
          updated_at?: string
          valor_participacao?: number | null
        }
        Relationships: []
      }
      inscricoes_feiras: {
        Row: {
          created_at: string
          data_inscricao: string
          feira_id: string
          feirante_id: string
          id: string
          observacoes: string | null
          segmento_inscrito:
            | Database["public"]["Enums"]["feirante_segment"]
            | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_inscricao?: string
          feira_id: string
          feirante_id: string
          id?: string
          observacoes?: string | null
          segmento_inscrito?:
            | Database["public"]["Enums"]["feirante_segment"]
            | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_inscricao?: string
          feira_id?: string
          feirante_id?: string
          id?: string
          observacoes?: string | null
          segmento_inscrito?:
            | Database["public"]["Enums"]["feirante_segment"]
            | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscricoes_feiras_feira_id_fkey"
            columns: ["feira_id"]
            isOneToOne: false
            referencedRelation: "feiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricoes_feiras_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "admin_feirante_contact"
            referencedColumns: ["feirante_id"]
          },
          {
            foreignKeyName: "inscricoes_feiras_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "feirantes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          comprovante_feirante_url: string | null
          comprovante_url: string | null
          created_at: string
          data_pagamento: string | null
          data_referencia: string
          data_upload: string | null
          feira_id: string
          feirante_id: string
          id: string
          metodo_pagamento: string | null
          status: Database["public"]["Enums"]["payment_status"]
          taxa_energia: number | null
          taxa_limpeza: number | null
          taxa_participacao: number
          taxa_seguranca: number | null
          updated_at: string
          valor_total: number
          verificado_por: string | null
        }
        Insert: {
          comprovante_feirante_url?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_referencia: string
          data_upload?: string | null
          feira_id: string
          feirante_id: string
          id?: string
          metodo_pagamento?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          taxa_energia?: number | null
          taxa_limpeza?: number | null
          taxa_participacao?: number
          taxa_seguranca?: number | null
          updated_at?: string
          valor_total: number
          verificado_por?: string | null
        }
        Update: {
          comprovante_feirante_url?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_referencia?: string
          data_upload?: string | null
          feira_id?: string
          feirante_id?: string
          id?: string
          metodo_pagamento?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          taxa_energia?: number | null
          taxa_limpeza?: number | null
          taxa_participacao?: number
          taxa_seguranca?: number | null
          updated_at?: string
          valor_total?: number
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_feira_id_fkey"
            columns: ["feira_id"]
            isOneToOne: false
            referencedRelation: "feiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "admin_feirante_contact"
            referencedColumns: ["feirante_id"]
          },
          {
            foreignKeyName: "pagamentos_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "feirantes"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_feirante: {
        Row: {
          categoria: string
          created_at: string
          feirante_id: string
          id: string
          subcategoria: string
        }
        Insert: {
          categoria: string
          created_at?: string
          feirante_id: string
          id?: string
          subcategoria: string
        }
        Update: {
          categoria?: string
          created_at?: string
          feirante_id?: string
          id?: string
          subcategoria?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_feirante_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "admin_feirante_contact"
            referencedColumns: ["feirante_id"]
          },
          {
            foreignKeyName: "produtos_feirante_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "feirantes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          feiras_por_semana: number | null
          foto_url: string | null
          full_name: string
          id: string
          media_feirantes_por_feira: number | null
          phone: string | null
          pix_key: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          feiras_por_semana?: number | null
          foto_url?: string | null
          full_name: string
          id: string
          media_feirantes_por_feira?: number | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          feiras_por_semana?: number | null
          foto_url?: string | null
          full_name?: string
          id?: string
          media_feirantes_por_feira?: number | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          created_at: string
          data_feira: string
          feira_id: string
          feirante_id: string
          id: string
          observacoes: string | null
          valor_vendido: number
        }
        Insert: {
          created_at?: string
          data_feira: string
          feira_id: string
          feirante_id: string
          id?: string
          observacoes?: string | null
          valor_vendido: number
        }
        Update: {
          created_at?: string
          data_feira?: string
          feira_id?: string
          feirante_id?: string
          id?: string
          observacoes?: string | null
          valor_vendido?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_feira_id_fkey"
            columns: ["feira_id"]
            isOneToOne: false
            referencedRelation: "feiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "admin_feirante_contact"
            referencedColumns: ["feirante_id"]
          },
          {
            foreignKeyName: "vendas_feirante_id_fkey"
            columns: ["feirante_id"]
            isOneToOne: false
            referencedRelation: "feirantes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_feirante_contact: {
        Row: {
          bloqueado: boolean | null
          feirante_id: string | null
          foto_url: string | null
          full_name: string | null
          motivo_bloqueio: string | null
          segmento: Database["public"]["Enums"]["feirante_segment"] | null
          user_id: string | null
          whatsapp: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "feirante"
      feirante_segment:
        | "alimentacao"
        | "roupas"
        | "artesanato"
        | "servicos"
        | "outros"
        | "doces"
        | "joias"
        | "tapetes"
      payment_status:
        | "pago"
        | "pendente"
        | "atrasado"
        | "aguardando_verificacao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "feirante"],
      feirante_segment: [
        "alimentacao",
        "roupas",
        "artesanato",
        "servicos",
        "outros",
        "doces",
        "joias",
        "tapetes",
      ],
      payment_status: [
        "pago",
        "pendente",
        "atrasado",
        "aguardando_verificacao",
      ],
    },
  },
} as const
