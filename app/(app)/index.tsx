import { View, Text, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuthStore } from '@/store/authStore';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { useGastos } from '@/hooks/useGastos';
import { formatCurrency } from '@/utils/format';

type StatusColor = 'primary' | 'amber' | 'danger';

function statusColor(ratio: number): StatusColor {
  if (ratio > 1) return 'danger';
  if (ratio >= 0.8) return 'amber';
  return 'primary';
}

const textColor: Record<StatusColor, string> = {
  primary: 'text-primary',
  amber: 'text-amber',
  danger: 'text-danger',
};

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'você';

  const { config, isLoading: loadingConfig } = useConfiguracoes();
  const { gastos, isLoading: loadingGastos } = useGastos();

  const isLoading = loadingConfig || loadingGastos;

  const renda = config ? config.salario + config.renda_extra : 0;

  const totalGastos = gastos.reduce((sum, g) => sum + g.valor, 0);
  const saldo = renda - totalGastos;

  const necessidades = gastos.filter((g) => g.categoria === 'necessidade').reduce((s, g) => s + g.valor, 0);
  const qualidade    = gastos.filter((g) => g.categoria === 'qualidade').reduce((s, g) => s + g.valor, 0);
  const objetivos    = gastos.filter((g) => g.categoria === 'objetivo').reduce((s, g) => s + g.valor, 0);

  const budgets = {
    necessidade: renda * 0.5,
    qualidade:   renda * 0.3,
    objetivo:    renda * 0.2,
  };

  const ratios = {
    necessidade: budgets.necessidade > 0 ? necessidades / budgets.necessidade : 0,
    qualidade:   budgets.qualidade   > 0 ? qualidade   / budgets.qualidade   : 0,
    objetivo:    budgets.objetivo    > 0 ? objetivos   / budgets.objetivo    : 0,
  };

  const saldoColor: StatusColor = saldo > 0 ? 'primary' : saldo < 0 ? 'danger' : 'amber';

  const distribuicao = [
    { label: 'Necessidades', pct: '50%', atual: necessidades, budget: budgets.necessidade, ratio: ratios.necessidade },
    { label: 'Qualidade de Vida', pct: '30%', atual: qualidade,    budget: budgets.qualidade,   ratio: ratios.qualidade },
    { label: 'Objetivos',     pct: '20%', atual: objetivos,   budget: budgets.objetivo,    ratio: ratios.objetivo },
  ];

  return (
    <Screen>
      <View className="pt-6 gap-6">
        {/* Header */}
        <View>
          <Text className="text-2xl font-bold text-foreground">Olá, {firstName}</Text>
          <Text className="text-muted mt-1">Seu resumo financeiro</Text>
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#1D9E75" size="large" />
          </View>
        ) : (
          <>
            {/* Summary cards */}
            <View className="gap-3">
              <Card className="flex-row items-center justify-between">
                <Text className="text-muted text-sm font-medium">Renda</Text>
                <Text className="text-primary font-bold text-lg">{formatCurrency(renda)}</Text>
              </Card>

              <Card className="flex-row items-center justify-between">
                <Text className="text-muted text-sm font-medium">Gastos</Text>
                <Text className="text-danger font-bold text-lg">{formatCurrency(totalGastos)}</Text>
              </Card>

              <Card className="flex-row items-center justify-between">
                <Text className="text-muted text-sm font-medium">Saldo livre</Text>
                <Text className={`font-bold text-lg ${textColor[saldoColor]}`}>
                  {formatCurrency(saldo)}
                </Text>
              </Card>
            </View>

            {/* 50/30/20 distribution */}
            <View className="gap-4">
              <Text className="text-foreground text-lg font-bold">Distribuição 50/30/20</Text>

              {distribuicao.map((item) => {
                const color = statusColor(item.ratio);
                return (
                  <Card key={item.label} className="gap-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-foreground font-semibold text-sm">{item.label}</Text>
                        <View className="bg-border px-2 py-0.5 rounded-md">
                          <Text className="text-muted text-xs">{item.pct}</Text>
                        </View>
                      </View>
                      <Text className={`text-sm font-semibold ${textColor[color]}`}>
                        {formatCurrency(item.atual)}
                        <Text className="text-muted font-normal"> / {formatCurrency(item.budget)}</Text>
                      </Text>
                    </View>
                    <ProgressBar value={item.ratio} color={color} />
                  </Card>
                );
              })}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
