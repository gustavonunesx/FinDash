import { View } from 'react-native';

type Color = 'primary' | 'amber' | 'danger';

interface ProgressBarProps {
  value: number; // 0–1
  color?: Color;
}

const fillColor: Record<Color, string> = {
  primary: 'bg-primary',
  amber: 'bg-amber',
  danger: 'bg-danger',
};

export function ProgressBar({ value, color = 'primary' }: ProgressBarProps) {
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <View className="h-2 bg-border rounded-full overflow-hidden">
      <View
        className={`h-full rounded-full ${fillColor[color]}`}
        style={{ width: `${pct}%` }}
      />
    </View>
  );
}
