import { Redirect, Tabs } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import {
  IconLayoutDashboard,
  IconCash,
  IconCalculator,
  IconPigMoney,
  IconSettings,
} from '@tabler/icons-react-native';
import { useAuthStore } from '@/store/authStore';

export default function AppLayout() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#1D9E75" size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A24',
          borderTopColor: '#2A2A38',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#1D9E75',
        tabBarInactiveTintColor: '#8888A0',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <IconLayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gastos/index"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ color, size }) => <IconCash size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calculadora/index"
        options={{
          title: 'Calcular',
          tabBarIcon: ({ color, size }) => <IconCalculator size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fundos/index"
        options={{
          title: 'Fundos',
          tabBarIcon: ({ color, size }) => <IconPigMoney size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="configuracoes/index"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, size }) => <IconSettings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
