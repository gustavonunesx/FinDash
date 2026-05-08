import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
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
});

type FormData = z.infer<typeof schema>;

export default function RecuperarSenhaScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormData) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Toast.show({ type: 'error', text1: error.message });
      return;
    }
    Toast.show({ type: 'success', text1: 'Link de recuperação enviado para seu e-mail' });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen scroll={false}>
        <View className="flex-1 justify-center gap-8">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Recuperar senha</Text>
            <Text className="text-muted">
              Enviaremos um link de redefinição para seu e-mail
            </Text>
          </View>

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

            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg">
              Enviar link
            </Button>

            <Button variant="ghost" onPress={() => router.back()}>
              Voltar ao login
            </Button>
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
