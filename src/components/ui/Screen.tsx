import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps extends ScrollViewProps {
  scroll?: boolean;
  children: React.ReactNode;
}

export function Screen({ scroll = true, children, className, ...props }: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className={`flex-1 px-5 ${className ?? ''}`}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName={`px-5 pb-8 ${className ?? ''}`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
