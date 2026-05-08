import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }: FormData) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Toast.show({ type: 'error', text1: error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error.message });
      return;
    }
    router.replace('/(app)');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen scroll={false}>
        <View className="flex-1 justify-center gap-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-4xl font-bold text-foreground">
              Fin<Text className="text-primary">Dash</Text>
            </Text>
            <Text className="text-muted text-base">
              Controle seu dinheiro com a regra 50/30/20
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="E-mail"
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Senha"
                  placeholder="••••••••"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                />
              )}
            />

            <TouchableOpacity onPress={() => router.push('/(auth)/recuperar-senha')}>
              <Text className="text-primary text-sm text-right">Esqueci minha senha</Text>
            </TouchableOpacity>

            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg">
              Entrar
            </Button>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center gap-1">
            <Text className="text-muted">Não tem conta?</Text>
            <Link href="/(auth)/cadastro" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">Criar agora</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
