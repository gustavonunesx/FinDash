import { IconLock, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import { AgenteChat } from "@/components/agente/agente-chat";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { paraExibicao } from "@/lib/agente/mensagens";
import type { LinhaMensagem } from "@/lib/agente/tipos";
import { getProfile } from "@/lib/data";
import { isDemoMode } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

function Bloqueio({ titulo, texto, upgrade }: { titulo: string; texto: string; upgrade?: boolean }) {
  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-secondary/50">
          <IconLock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {upgrade ? "Premium" : "Indisponível"}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{titulo}</h1>
        <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{texto}</p>
        {upgrade && (
          <Link href="/precos" className="mt-8">
            <Button className="rounded-md bg-foreground text-background hover:bg-foreground/85">
              Upgrade para Premium
            </Button>
          </Link>
        )}
      </div>
    </AppShell>
  );
}

export default async function AgentePage() {
  if (isDemoMode()) {
    return (
      <Bloqueio
        titulo="Agente Financeiro"
        texto="O agente precisa de uma conta real para ler e guardar a sua ficha financeira. Ele não funciona no modo de demonstração."
      />
    );
  }

  const profile = await getProfile();
  if (profile?.plano !== "premium") {
    return (
      <Bloqueio
        upgrade
        titulo="Agente Financeiro"
        texto="Um conselheiro que conhece a sua renda, as suas contas e as suas caixinhas, e diz o que fazer com cada real que entra. Disponível no plano Premium."
      />
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("agente_mensagens")
    .select("id, ordem, papel, conteudo, inicio_rodada, criado_em")
    .order("ordem", { ascending: false })
    .limit(100);
  const linhas = ((data ?? []) as LinhaMensagem[]).slice().reverse();
  const inicio = linhas.findIndex((l) => l.inicio_rodada);
  const mensagensIniciais = inicio >= 0 ? paraExibicao(linhas.slice(inicio)) : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fd-green/15">
            <IconSparkles size={22} stroke={2} className="text-fd-green" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Agente Financeiro</h1>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              Seu conselheiro de dinheiro, com a sua ficha financeira sempre à mão
            </p>
          </div>
        </header>
        <AgenteChat mensagensIniciais={mensagensIniciais} />
      </div>
    </AppShell>
  );
}
