import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function ConfiguracoesScreen() {
  const { user, clear } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clear();
    router.replace('/(auth)/login');
  };

  return (
    <Screen>
      <View className="pt-6 gap-6">
        <Text className="text-2xl font-bold text-foreground">Configurações</Text>

        <View className="bg-card border border-border rounded-2xl p-5 gap-2">
          <Text className="text-muted text-xs font-medium uppercase tracking-wide">Conta</Text>
          <Text className="text-foreground font-medium">
            {user?.user_metadata?.full_name ?? 'Usuário'}
          </Text>
          <Text className="text-muted text-sm">{user?.email}</Text>
        </View>

        <Button variant="danger" onPress={handleLogout}>
          Sair da conta
        </Button>
      </View>
    </Screen>
  );
}
