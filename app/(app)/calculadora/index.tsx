import { View, Text } from 'react-native';
import { Screen } from '@/components/ui/Screen';

export default function CalculadoraScreen() {
  return (
    <Screen>
      <View className="pt-6">
        <Text className="text-2xl font-bold text-foreground">Calculadora</Text>
        <Text className="text-muted mt-1">Em construção (M3)</Text>
      </View>
    </Screen>
  );
}
