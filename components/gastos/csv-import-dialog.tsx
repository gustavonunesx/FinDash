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
  importarGastosCsv,
} from "@/app/(app)/gastos/import-actions";
import type { CsvGastoRow } from "@/lib/csv-parser";
import { CATEGORIA_LABELS } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<CsvGastoRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      startTransition(async () => {
        const content = reader.result as string;
        const result = await parseCsvPreview(content);
        setPreview(result.rows);
        setErrors(result.errors);
        if (result.rows.length === 0 && result.errors.length > 0) {
          toast.error(result.errors[0]);
        }
      });
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await importarGastosCsv(preview);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.imported} gastos importados`);
      if (result.skipped && result.skipped > 0) {
        toast.info(`${result.skipped} linhas ignoradas (limite do plano)`);
      }
      setOpen(false);
      setPreview([]);
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <IconUpload className="h-4 w-4" />
        Importar CSV
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar gastos via CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Colunas esperadas: <code className="text-fd-green">nome</code>,{" "}
              <code className="text-fd-green">valor</code>,{" "}
              <code className="text-fd-green">categoria</code> (opcional — mapeamento automático).
            </p>

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground"
            />

            {errors.length > 0 && (
              <div className="rounded-lg border border-fd-amber/30 bg-fd-amber/10 p-3 text-xs text-fd-amber">
                {errors.slice(0, 5).map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}

            {preview.length > 0 && (
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

            {preview.length > 0 && (
              <Button className="w-full" onClick={handleConfirm} disabled={pending}>
                {pending ? "Importando..." : `Confirmar importação (${preview.length} gastos)`}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
