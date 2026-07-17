"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HistoricoMensal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TrendIndicators } from "@/components/historico/trend-indicators";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface HistoricoChartsProps {
  historico: HistoricoMensal[];
}

function formatMes(mes: string) {
  const d = new Date(mes);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export function HistoricoCharts({ historico }: HistoricoChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const lineData = historico.map((h) => ({
    mes: formatMes(h.mes),
    renda: h.salario,
    gastos: h.total_gastos,
    saldo: h.salario - h.total_gastos,
  }));

  const fundoKeys = Object.keys(historico[0]?.snapshot_fundos ?? {});
  const fundoEvolution = historico.map((h) => {
    const entry: Record<string, string | number> = { mes: formatMes(h.mes) };
    fundoKeys.forEach((k) => {
      entry[k] = h.snapshot_fundos[k] ?? 0;
    });
    return entry;
  });

  const categoryData = historico.map((h) => ({
    mes: formatMes(h.mes),
    necessidade: Math.round(h.total_gastos * 0.5),
    objetivo: Math.round(h.total_gastos * 0.3),
    qualidade: Math.round(h.total_gastos * 0.2),
  }));

  useGSAP(
    () => {
      const charts = containerRef.current?.querySelectorAll("[data-chart]");
      charts?.forEach((chart, i) => {
        gsap.fromTo(
          chart,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.1,
            scrollTrigger: { trigger: chart, start: "top 85%" },
          }
        );
      });
    },
    { scope: containerRef, dependencies: [historico] }
  );

  return (
    <div ref={containerRef} className="space-y-8">
      <TrendIndicators historico={historico} />

      <Card data-chart className="border-border/60">
        <CardHeader>
          <CardTitle>Renda vs. Gastos</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
              <XAxis dataKey="mes" stroke="#8888A0" fontSize={12} />
              <YAxis stroke="#8888A0" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "#1A1A24", border: "1px solid #2A2A38", borderRadius: 8 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="renda"
                stroke="#1D9E75"
                strokeWidth={2}
                dot={{ fill: "#1D9E75" }}
                isAnimationActive
                animationDuration={1200}
                name="Renda"
              />
              <Line
                type="monotone"
                dataKey="gastos"
                stroke="#C94040"
                strokeWidth={2}
                dot={{ fill: "#C94040" }}
                isAnimationActive
                animationDuration={1200}
                name="Gastos"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card data-chart className="border-border/60">
        <CardHeader>
          <CardTitle>Saldo livre mensal</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
              <XAxis dataKey="mes" stroke="#8888A0" fontSize={12} />
              <YAxis stroke="#8888A0" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "#1A1A24", border: "1px solid #2A2A38", borderRadius: 8 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar
                dataKey="saldo"
                fill="#378ADD"
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={1000}
                name="Saldo livre"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card data-chart className="border-border/60">
        <CardHeader>
          <CardTitle>Gastos por categoria (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
              <XAxis dataKey="mes" stroke="#8888A0" fontSize={12} />
              <YAxis stroke="#8888A0" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "#1A1A24", border: "1px solid #2A2A38", borderRadius: 8 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend />
              <Bar dataKey="necessidade" fill="#E8923A" name="Necessidades" radius={[2, 2, 0, 0]} />
              <Bar dataKey="objetivo" fill="#1D9E75" name="Objetivos" radius={[2, 2, 0, 0]} />
              <Bar dataKey="qualidade" fill="#378ADD" name="Qualidade" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {fundoKeys.length > 0 && (
        <Card data-chart className="border-border/60">
          <CardHeader>
            <CardTitle>Evolução dos fundos</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fundoEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
                <XAxis dataKey="mes" stroke="#8888A0" fontSize={12} />
                <YAxis stroke="#8888A0" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "#1A1A24", border: "1px solid #2A2A38", borderRadius: 8 }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend />
                {fundoKeys.map((k, i) => (
                  <Line
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stroke={["#1D9E75", "#378ADD", "#7C5CBF"][i % 3]}
                    strokeWidth={2}
                    isAnimationActive
                    animationDuration={1200}
                    name={k === "f1" ? "Reserva" : k === "f2" ? "Viagem" : "AP"}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card data-chart className="border-border/60">
        <CardHeader>
          <CardTitle>Resumo mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Mês</th>
                  <th className="pb-3 pr-4">Renda</th>
                  <th className="pb-3 pr-4">Gastos</th>
                  <th className="pb-3">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {[...historico].reverse().map((h) => {
                  const saldo = h.salario - h.total_gastos;
                  return (
                    <tr key={h.id} className="border-b border-border/50">
                      <td className="py-3 pr-4">{formatMes(h.mes)}</td>
                      <td className="py-3 pr-4 font-mono">{formatCurrency(h.salario)}</td>
                      <td className="py-3 pr-4 font-mono text-fd-red">
                        {formatCurrency(h.total_gastos)}
                      </td>
                      <td
                        className={`py-3 font-mono ${saldo >= 0 ? "text-fd-green" : "text-fd-red"}`}
                      >
                        {formatCurrency(saldo)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
