import { View, Text } from 'react-native';
import type { Gasto } from '@/types/database';

type Categoria = Gasto['categoria'];

const config: Record<Categoria, { label: string; bg: string; text: string }> = {
  necessidade: { label: 'Necessidade', bg: 'bg-primary/20', text: 'text-primary' },
  qualidade:   { label: 'Qualidade',   bg: 'bg-blue/20',    text: 'text-blue' },
  objetivo:    { label: 'Objetivo',    bg: 'bg-amber/20',   text: 'text-amber' },
};

export function CategoryBadge({ categoria }: { categoria: Categoria }) {
  const { label, bg, text } = config[categoria];
  return (
    <View className={`px-2 py-0.5 rounded-md ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{label}</Text>
    </View>
  );
}
