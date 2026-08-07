"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// O widget monta um iframe e toca em `window` na inicialização, então fica fora
// do SSR.
const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((m) => m.PluggyConnect),
  { ssr: false }
);

interface ConectarBancoProps {
  /** Item a revalidar quando o consentimento expira. Ausente = conexão nova. */
  itemId?: string;
  onConectado: (itemId: string) => void;
  onFechar: () => void;
}

export function ConectarBanco({ itemId, onConectado, onFechar }: ConectarBancoProps) {
  const [connectToken, setConnectToken] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const res = await fetch("/api/open-finance/connect-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemId ? { itemId } : {}),
        });
        const data = await res.json();

        if (!ativo) return;
        if (!res.ok) {
          setErro(data.error ?? "Não foi possível iniciar a conexão.");
          return;
        }
        setConnectToken(data.accessToken);
      } catch {
        if (ativo) setErro("Falha de rede ao iniciar a conexão.");
      }
    })();

    return () => {
      ativo = false;
    };
  }, [itemId]);

  if (erro) {
    return (
      <div
        role="alert"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(15,23,41,0.45)",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 24,
            maxWidth: 340,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0F1729", marginBottom: 6 }}>
            Não deu para conectar
          </p>
          <p style={{ fontSize: 12, color: "#7C8896", marginBottom: 16 }}>{erro}</p>
          <button
            type="button"
            onClick={onFechar}
            style={{
              padding: "8px 18px",
              borderRadius: 9,
              border: "none",
              background: "#0E8F6A",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (!connectToken) return null;

  return (
    <PluggyConnect
      connectToken={connectToken}
      // Sem os conectores de sandbox não há como testar o fluxo sem uma conta
      // bancária real.
      includeSandbox={process.env.NODE_ENV !== "production"}
      language="pt"
      theme="light"
      {...(itemId ? { updateItem: itemId } : {})}
      onSuccess={(data) => onConectado(data.item.id)}
      onError={(error) => setErro(error.message || "A conexão com o banco falhou.")}
      onClose={onFechar}
    />
  );
}
