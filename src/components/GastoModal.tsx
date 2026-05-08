import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Gasto } from '@/types/database';

const schema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  valor: z.string().min(1, 'Informe o valor'),
  categoria: z.enum(['necessidade', 'objetivo', 'qualidade']),
});

type FormData = z.infer<typeof schema>;

type Categoria = Gasto['categoria'];

const categorias: { value: Categoria; label: string; activeClass: string; inactiveClass: string }[] = [
  { value: 'necessidade', label: 'Necessidade', activeClass: 'bg-primary border-primary', inactiveClass: 'border-border' },
  { value: 'qualidade',   label: 'Qualidade',   activeClass: 'bg-blue border-blue',       inactiveClass: 'border-border' },
  { value: 'objetivo',    label: 'Objetivo',    activeClass: 'bg-amber border-amber',     inactiveClass: 'border-border' },
];

interface GastoModalProps {
  visible: boolean;
  gasto?: Gasto | null; // null = novo
  onClose: () => void;
  onSave: (data: { nome: string; valor: number; categoria: Categoria }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function GastoModal({ visible, gasto, onClose, onSave, onDelete }: GastoModalProps) {
  const isEdit = !!gasto;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', valor: '', categoria: 'necessidade' as const },
  });

  useEffect(() => {
    if (visible) {
      reset(
        gasto
          ? { nome: gasto.nome, valor: String(gasto.valor), categoria: gasto.categoria }
          : { nome: '', valor: '', categoria: 'necessidade' },
      );
    }
  }, [visible, gasto]);

  const onSubmit = async (data: FormData) => {
    const valor = parseFloat(data.valor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      Toast.show({ type: 'error', text1: 'Informe um valor válido' });
      return;
    }
    await onSave({ nome: data.nome, valor, categoria: data.categoria });
    onClose();
  };

  function handleDelete() {
    if (!gasto || !onDelete) return;
    Alert.alert('Excluir gasto', `Deseja excluir "${gasto.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await onDelete(gasto.id);
          onClose();
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable className="flex-1 bg-black/60" onPress={onClose} />

        <View className="bg-card rounded-t-3xl px-5 pt-5 pb-8 gap-4">
          {/* Handle */}
          <View className="w-10 h-1 bg-border rounded-full self-center mb-1" />

          <Text className="text-foreground text-xl font-bold">
            {isEdit ? 'Editar gasto' : 'Novo gasto'}
          </Text>

          {/* Nome */}
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nome"
                placeholder="ex: Aluguel"
                value={value}
                onChangeText={onChange}
                error={errors.nome?.message}
              />
            )}
          />

          {/* Valor */}
          <Controller
            control={control}
            name="valor"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Valor (R$)"
                placeholder="0,00"
                keyboardType="numeric"
                value={value as string}
                onChangeText={onChange}
                error={errors.valor?.message}
              />
            )}
          />

          {/* Categoria */}
          <Controller
            control={control}
            name="categoria"
            render={({ field: { onChange, value } }) => (
              <View className="gap-2">
                <Text className="text-muted text-sm font-medium">Categoria</Text>
                <View className="flex-row gap-2">
                  {categorias.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => onChange(cat.value)}
                      activeOpacity={0.75}
                      className={`flex-1 items-center py-2 rounded-xl border ${
                        value === cat.value ? cat.activeClass : cat.inactiveClass
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          value === cat.value ? 'text-background' : 'text-muted'
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          />

          {/* Buttons */}
          <View className="gap-2 mt-2">
            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg">
              Salvar
            </Button>
            {isEdit && onDelete && (
              <Button variant="danger" onPress={handleDelete} size="lg">
                Excluir gasto
              </Button>
            )}
            <Button variant="ghost" onPress={onClose} size="lg">
              Cancelar
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
