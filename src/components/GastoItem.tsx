import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { IconTrash } from '@tabler/icons-react-native';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { formatCurrency } from '@/utils/format';
import type { Gasto } from '@/types/database';

interface GastoItemProps {
  gasto: Gasto;
  onPress: (gasto: Gasto) => void;
  onDelete: (id: string) => void;
}

export function GastoItem({ gasto, onPress, onDelete }: GastoItemProps) {
  function handleDelete() {
    Alert.alert(
      'Excluir gasto',
      `Deseja excluir "${gasto.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onDelete(gasto.id) },
      ],
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(gasto)}
      activeOpacity={0.75}
      className="flex-row items-center bg-card border border-border rounded-2xl px-4 py-3 mb-3"
    >
      <View className="flex-1 gap-1">
        <Text className="text-foreground font-medium text-base" numberOfLines={1}>
          {gasto.nome}
        </Text>
        <CategoryBadge categoria={gasto.categoria} />
      </View>

      <Text className="text-foreground font-semibold text-base mr-3">
        {formatCurrency(gasto.valor)}
      </Text>

      <TouchableOpacity onPress={handleDelete} hitSlop={8} activeOpacity={0.6}>
        <IconTrash size={18} color="#E24B4A" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
