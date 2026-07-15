import { useColorScheme } from 'react-native';
import { Colors, Typography, Spacing, Border } from '../constants/theme';

export const useTheme = () => {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return {
    colors,
    typography: Typography,
    spacing: Spacing,
    border: Border,
    isDark,
  };
};

export default useTheme;
