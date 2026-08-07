"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  parseCsvPreview,
  parseOfxPreview,
  importarGastosCsv,
  importarGastosOfx,
} from "@/app/(app)/gastos/import-actions";
import type { CsvGastoRow } from "@/lib/csv-parser";
import type { OfxTransacao } from "@/lib/ofx-parser";
import { CATEGORIA_LABELS, type Banco, type CategoriaGasto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const CATEGORIAS: CategoriaGasto[] = ["necessidade", "objetivo", "qualidade"];

interface ImportDialogProps {
  bancos: Banco[];
}

export function CsvImportDialog({ bancos }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [formato, setFormato] = useState<"csv" | "ofx" | null>(null);
  const [preview, setPreview] = useState<CsvGastoRow[]>([]);
  const [ofxRows, setOfxRows] = useState<OfxTransacao[]>([]);
  const [jaImportados, setJaImportados] = useState<Set<string>>(new Set());
  const [conta, setConta] = useState<string | null>(null);
  const [bancoId, setBancoId] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function reset() {
    setFormato(null);
    setPreview([]);
    setOfxRows([]);
    setJaImportados(new Set());
    setConta(null);
    setErrors([]);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ehOfx =
      file.name.toLowerCase().endsWith(".ofx") || file.type === "application/x-ofx";

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      startTransition(async () => {
        if (ehOfx) {
          const r = await parseOfxPreview(content);
          setFormato("ofx");
          setOfxRows(r.transacoes);
          setJaImportados(new Set(r.jaImportados));
          setConta(r.conta);
          setErrors(r.errors);
          setPreview([]);
          if (r.transacoes.length === 0) {
            toast.error(r.errors[0] ?? "Nenhuma despesa encontrada no extrato.");
          }
        } else {
          const r = await parseCsvPreview(content);
          setFormato("csv");
          setPreview(r.rows);
          setErrors(r.errors);
          setOfxRows([]);
          if (r.rows.length === 0 && r.errors.length > 0) toast.error(r.errors[0]);
        }
      });
    };
    // OFX brasileiro costuma vir em Latin-1; ler como UTF-8 quebraria acentos.
    reader.readAsText(file, ehOfx ? "ISO-8859-1" : "UTF-8");
  }

  function mudarCategoria(fitid: string, categoria: CategoriaGasto) {
    setOfxRows((rows) =>
      rows.map((r) => (r.fitid === fitid ? { ...r, categoria } : r))
    );
  }

  const novos = ofxRows.filter((r) => !jaImportados.has(r.fitid));

  function handleConfirm() {
    startTransition(async () => {
      if (formato === "ofx") {
        const result = await importarGastosOfx(
          novos.map((r) => ({
            fitid: r.fitid,
            nome: r.nome,
            valor: r.valor,
            categoria: r.categoria,
            data: r.data,
          })),
          bancoId || null
        );
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(`${result.imported} gastos importados`);
        if (result.duplicados) {
          toast.info(`${result.duplicados} já existiam e foram ignorados`);
        }
      } else {
        const result = await importarGastosCsv(preview);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(`${result.imported} gastos importados`);
        if (result.skipped && result.skipped > 0) {
          toast.info(`${result.skipped} linhas ignoradas (limite do plano)`);
        }
      }
      setOpen(false);
      reset();
    });
  }

  const total = formato === "ofx" ? novos.length : preview.length;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <IconUpload className="h-4 w-4" />
        Importar extrato
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar gastos</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie o <strong>extrato OFX</strong> do seu banco (o mesmo arquivo que os
              apps de finanças pedem) ou um <strong>CSV</strong> com as colunas{" "}
              <code className="text-fd-green">nome</code>,{" "}
              <code className="text-fd-green">valor</code> e{" "}
              <code className="text-fd-green">categoria</code>.
            </p>

            <input
              type="file"
              accept=".csv,.ofx,text/csv,application/x-ofx"
              onChange={handleFile}
              className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground"
            />

            {formato === "ofx" && conta && (
              <p className="text-xs text-muted-foreground">
                Conta <span className="font-mono">{conta}</span>
                {jaImportados.size > 0 && (
                  <> — {jaImportados.size} transação(ões) já importada(s) serão ignoradas</>
                )}
              </p>
            )}

            {formato === "ofx" && novos.length > 0 && bancos.length > 0 && (
              <label className="block text-sm">
                <span className="text-muted-foreground">Vincular ao banco</span>
                <select
                  value={bancoId}
                  onChange={(e) => setBancoId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-transparent p-2 text-sm"
                >
                  <option value="">Sem banco definido</option>
                  {bancos.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {errors.length > 0 && (
              <div className="rounded-lg border border-fd-amber/30 bg-fd-amber/10 p-3 text-xs text-fd-amber">
                {errors.slice(0, 5).map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
                {errors.length > 5 && <p>e mais {errors.length - 5}…</p>}
              </div>
            )}

            {formato === "ofx" && novos.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  A categoria é um palpite pela descrição do extrato — confira antes de
                  confirmar.
                </p>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="p-3">Data</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Categoria</th>
                      </tr>
                    </thead>
                    <tbody>
                      {novos.map((row) => (
                        <tr key={row.fitid} className="border-b border-border/50">
                          <td className="p-3 font-mono text-xs">
                            {new Date(row.data).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-3">{row.nome}</td>
                          <td className="p-3 font-mono">{formatCurrency(row.valor)}</td>
                          <td className="p-3">
                            <select
                              value={row.categoria}
                              onChange={(e) =>
                                mudarCategoria(row.fitid, e.target.value as CategoriaGasto)
                              }
                              className="rounded-md border border-border bg-transparent p-1 text-xs"
                            >
                              {CATEGORIAS.map((c) => (
                                <option key={c} value={c}>
                                  {CATEGORIA_LABELS[c]}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {formato === "csv" && preview.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="p-3">Nome</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-3">{row.nome}</td>
                        <td className="p-3 font-mono">{formatCurrency(row.valor)}</td>
                        <td className="p-3">
                          <Badge variant="outline">{CATEGORIA_LABELS[row.categoria]}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {total > 0 && (
              <Button className="w-full" onClick={handleConfirm} disabled={pending}>
                {pending ? "Importando..." : `Confirmar importação (${total} gastos)`}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
