import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { IconPlus } from '@tabler/icons-react-native';
import Toast from 'react-native-toast-message';
import { Screen } from '@/components/ui/Screen';
import { GastoItem } from '@/components/GastoItem';
import { GastoModal } from '@/components/GastoModal';
import { useGastos } from '@/hooks/useGastos';
import { formatCurrency } from '@/utils/format';
import type { Gasto } from '@/types/database';

type ModalState = Gasto | 'novo' | null;

export default function GastosScreen() {
  const { gastos, isLoading, add, update, remove } = useGastos();
  const [modal, setModal] = useState<ModalState>(null);

  const total = gastos.reduce((sum, g) => sum + g.valor, 0);

  async function handleSave(data: { nome: string; valor: number; categoria: Gasto['categoria'] }) {
    if (modal === 'novo') {
      const error = await add(data);
      if (error) Toast.show({ type: 'error', text1: 'Erro ao salvar gasto' });
      else Toast.show({ type: 'success', text1: 'Gasto adicionado!' });
    } else if (modal && typeof modal === 'object') {
      const error = await update(modal.id, data);
      if (error) Toast.show({ type: 'error', text1: 'Erro ao atualizar gasto' });
      else Toast.show({ type: 'success', text1: 'Gasto atualizado!' });
    }
  }

  async function handleDelete(id: string) {
    const error = await remove(id);
    if (error) Toast.show({ type: 'error', text1: 'Erro ao excluir gasto' });
    else Toast.show({ type: 'success', text1: 'Gasto excluído!' });
  }

  return (
    <Screen scroll={false}>
      <View className="flex-1 pt-6">
        {/* Header */}
        <View className="mb-5">
          <Text className="text-2xl font-bold text-foreground">Gastos</Text>
          {!isLoading && (
            <Text className="text-muted mt-1">
              {gastos.length} {gastos.length === 1 ? 'item' : 'itens'} · {formatCurrency(total)}
            </Text>
          )}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#1D9E75" size="large" />
          </View>
        ) : gastos.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2">
            <Text className="text-muted text-base">Nenhum gasto cadastrado</Text>
            <Text className="text-muted text-sm">Toque em + para adicionar</Text>
          </View>
        ) : (
          <FlatList
            data={gastos}
            keyExtractor={(g) => g.id}
            renderItem={({ item }) => (
              <GastoItem
                gasto={item}
                onPress={(g) => setModal(g)}
                onDelete={handleDelete}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          onPress={() => setModal('novo')}
          activeOpacity={0.85}
          className="absolute bottom-6 right-0 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          style={{ elevation: 6 }}
        >
          <IconPlus size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <GastoModal
        visible={modal !== null}
        gasto={modal !== 'novo' ? modal : null}
        onClose={() => setModal(null)}
        onSave={handleSave}
        onDelete={modal && modal !== 'novo' ? handleDelete : undefined}
      />
    </Screen>
  );
}
