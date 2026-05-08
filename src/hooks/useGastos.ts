import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Gasto } from '@/types/database';

type GastoInsert = { nome: string; valor: number; categoria: Gasto['categoria'] };

export function useGastos() {
  const user = useAuthStore((s) => s.user);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('gastos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setGastos(data ?? []);
        setIsLoading(false);
      });
  }, [user]);

  const add = useCallback(
    async (payload: GastoInsert) => {
      if (!user) return;
      const { data, error } = await supabase
        .from('gastos')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (!error && data) setGastos((prev) => [data, ...prev]);
      return error;
    },
    [user],
  );

  const update = useCallback(async (id: string, payload: Partial<GastoInsert>) => {
    const { data, error } = await supabase
      .from('gastos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) setGastos((prev) => prev.map((g) => (g.id === id ? data : g)));
    return error;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (!error) setGastos((prev) => prev.filter((g) => g.id !== id));
    return error;
  }, []);

  return { gastos, isLoading, add, update, remove };
}
