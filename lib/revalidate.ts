import { revalidatePath } from "next/cache";

/**
 * Cada entidade financeira aparece em várias rotas ao mesmo tempo — um gasto pesa
 * no /dashboard, no 50/30/20 da /calculadora, no snapshot do /historico e na view
 * agregada da /familia. Revalidar só a rota onde a mutação aconteceu deixa as
 * outras servindo Router Cache velho, então o mapa abaixo é a fonte única de
 * "quem mais precisa saber disso".
 */
const ROTAS_POR_ENTIDADE = {
  gastos: ["/gastos", "/dashboard", "/calculadora", "/historico", "/familia"],
  fundos: ["/fundos", "/dashboard", "/calculadora", "/historico", "/familia"],
  config: ["/configuracoes", "/dashboard", "/calculadora", "/historico"],
  rendaExtra: ["/calculadora", "/dashboard", "/historico"],
  historico: ["/historico", "/dashboard"],
  perfil: ["/configuracoes", "/dashboard", "/familia"],
  familia: ["/familia", "/dashboard"],
} as const;

export type EntidadeFinanceira = keyof typeof ROTAS_POR_ENTIDADE;

export function revalidarEntidade(...entidades: EntidadeFinanceira[]) {
  const rotas = new Set(entidades.flatMap((e) => ROTAS_POR_ENTIDADE[e]));
  for (const rota of rotas) revalidatePath(rota);
}
