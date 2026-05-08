import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: string;
}

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-primary', text: 'text-white font-semibold' },
  secondary: { container: 'bg-card border border-border', text: 'text-foreground font-medium' },
  ghost: { container: '', text: 'text-muted font-medium' },
  danger: { container: 'bg-danger', text: 'text-white font-semibold' },
};

const sizeClasses: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2 rounded-lg', text: 'text-sm' },
  md: { container: 'px-5 py-3 rounded-xl', text: 'text-base' },
  lg: { container: 'px-6 py-4 rounded-xl', text: 'text-base' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const v = variantClasses[variant];
  const s = sizeClasses[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`items-center justify-center flex-row gap-2 ${v.container} ${s.container} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color="#fff" />}
      <Text className={`${v.text} ${s.text}`}>{children}</Text>
    </TouchableOpacity>
  );
}
