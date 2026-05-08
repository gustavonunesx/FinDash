export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          plan: 'free' | 'premium';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          plan?: 'free' | 'premium';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          full_name?: string | null;
          plan?: 'free' | 'premium';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
      };
      gastos: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          valor: number;
          categoria: 'necessidade' | 'objetivo' | 'qualidade';
          created_at: string;
        };
        Insert: {
          user_id: string;
          nome: string;
          valor: number;
          categoria: 'necessidade' | 'objetivo' | 'qualidade';
        };
        Update: {
          nome?: string;
          valor?: number;
          categoria?: 'necessidade' | 'objetivo' | 'qualidade';
        };
      };
      fundos: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          saldo_atual: number;
          meta: number;
          aporte_mensal: number;
          cor: string;
          ordem: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          nome: string;
          saldo_atual?: number;
          meta: number;
          aporte_mensal?: number;
          cor?: string;
          ordem?: number;
        };
        Update: {
          nome?: string;
          saldo_atual?: number;
          meta?: number;
          aporte_mensal?: number;
          cor?: string;
          ordem?: number;
        };
      };
      configuracoes: {
        Row: {
          id: string;
          user_id: string;
          salario: number;
          renda_extra: number;
          custo_vida: number;
          fase: 'construindo' | 'investindo';
          updated_at: string;
        };
        Insert: {
          user_id: string;
          salario?: number;
          renda_extra?: number;
          custo_vida?: number;
          fase?: 'construindo' | 'investindo';
        };
        Update: {
          salario?: number;
          renda_extra?: number;
          custo_vida?: number;
          fase?: 'construindo' | 'investindo';
        };
      };
      historico_mensal: {
        Row: {
          id: string;
          user_id: string;
          mes: string;
          salario: number;
          total_gastos: number;
          saldo_livre: number;
          snapshot_fundos: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          mes: string;
          salario: number;
          total_gastos: number;
          saldo_livre: number;
          snapshot_fundos?: Json;
        };
        Update: never;
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Gasto = Database['public']['Tables']['gastos']['Row'];
export type Fundo = Database['public']['Tables']['fundos']['Row'];
export type Configuracoes = Database['public']['Tables']['configuracoes']['Row'];
export type HistoricoMensal = Database['public']['Tables']['historico_mensal']['Row'];
