import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-muted text-sm font-medium">{label}</Text>
      )}
      <TextInput
        className={`bg-card border ${error ? 'border-danger' : 'border-border'} rounded-xl px-4 py-3 text-foreground text-base ${className ?? ''}`}
        placeholderTextColor="#8888A0"
        autoCapitalize="none"
        {...props}
      />
      {error && (
        <Text className="text-danger text-xs">{error}</Text>
      )}
    </View>
  );
}
