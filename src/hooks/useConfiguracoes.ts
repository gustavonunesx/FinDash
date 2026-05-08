import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Configuracoes } from '@/types/database';

export function useConfiguracoes() {
  const user = useAuthStore((s) => s.user);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('configuracoes')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setConfig(data);
        setIsLoading(false);
      });
  }, [user]);

  return { config, isLoading, error };
}
