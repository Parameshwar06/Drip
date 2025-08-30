import { createTheme } from '@mui/material/styles';

// Material Design 3 Color Tokens
const md3Colors = {
  light: {
    primary: '#006A6B',
    onPrimary: '#FFFFFF',
    primaryContainer: '#6FF6F7',
    onPrimaryContainer: '#001F1F',
    secondary: '#4A6363',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CCE8E7',
    onSecondaryContainer: '#051F20',
    tertiary: '#4B607C',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#D2E4FF',
    onTertiaryContainer: '#041C35',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: '#FAFDFC',
    onBackground: '#191C1C',
    surface: '#F8FAFA',
    onSurface: '#191C1C',
    surfaceVariant: '#DAE5E4',
    onSurfaceVariant: '#3F4948',
    outline: '#6F7978',
    outlineVariant: '#BEC9C8',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#2E3131',
    inverseOnSurface: '#EFF1F1',
    inversePrimary: '#4DDADB',
  },
  dark: {
    primary: '#4DDADB',
    onPrimary: '#001F1F',
    primaryContainer: '#00504F',
    onPrimaryContainer: '#6FF6F7',
    secondary: '#B0CCCA',
    onSecondary: '#1B3534',
    secondaryContainer: '#314B4A',
    onSecondaryContainer: '#CCE8E7',
    tertiary: '#B4C8E5',
    onTertiary: '#1E344A',
    tertiaryContainer: '#344A63',
    onTertiaryContainer: '#D2E4FF',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    background: '#0F1414',
    onBackground: '#DFE3E2',
    surface: '#0F1414',
    onSurface: '#DFE3E2',
    surfaceVariant: '#3F4948',
    onSurfaceVariant: '#BEC9C8',
    outline: '#889392',
    outlineVariant: '#3F4948',
    inverseSurface: '#DFE3E2',
    inverseOnSurface: '#2E3131',
    inversePrimary: '#006A6B',
  }
};

// Helper colors
const helperColors = {
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
};

export const createMD3Theme = (mode = 'light') => {
  const colors = md3Colors[mode];
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: mode === 'light' ? colors.primaryContainer : colors.primary,
        dark: mode === 'light' ? colors.primary : colors.primaryContainer,
        contrastText: colors.onPrimary,
      },
      secondary: {
        main: colors.secondary,
        light: colors.secondaryContainer,
        dark: colors.secondary,
        contrastText: colors.onSecondary,
      },
      tertiary: {
        main: colors.tertiary,
        light: colors.tertiaryContainer,
        dark: colors.tertiary,
        contrastText: colors.onTertiary,
      },
      error: {
        main: colors.error,
        light: colors.errorContainer,
        dark: colors.error,
        contrastText: colors.onError,
      },
      warning: {
        main: helperColors.warning,
        contrastText: '#FFFFFF',
      },
      info: {
        main: helperColors.info,
        contrastText: '#FFFFFF',
      },
      success: {
        main: helperColors.success,
        contrastText: '#FFFFFF',
      },
      background: {
        default: colors.background,
        paper: colors.surface,
      },
      text: {
        primary: colors.onBackground,
        secondary: colors.onSurfaceVariant,
      },
      divider: colors.outlineVariant,
      // Custom MD3 colors
      md3: colors,
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      // Material Design 3 Typography Scale
      displayLarge: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '3.5rem',
        lineHeight: 1.12,
        letterSpacing: '-0.25px',
      },
      displayMedium: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '2.8rem',
        lineHeight: 1.16,
        letterSpacing: '0px',
      },
      displaySmall: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '2.25rem',
        lineHeight: 1.22,
        letterSpacing: '0px',
      },
      headlineLarge: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '2rem',
        lineHeight: 1.25,
        letterSpacing: '0px',
      },
      headlineMedium: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '1.75rem',
        lineHeight: 1.29,
        letterSpacing: '0px',
      },
      headlineSmall: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '1.5rem',
        lineHeight: 1.33,
        letterSpacing: '0px',
      },
      titleLarge: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '1.375rem',
        lineHeight: 1.27,
        letterSpacing: '0px',
      },
      titleMedium: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: 1.5,
        letterSpacing: '0.15px',
      },
      titleSmall: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.43,
        letterSpacing: '0.1px',
      },
      labelLarge: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.43,
        letterSpacing: '0.1px',
      },
      labelMedium: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: '0.75rem',
        lineHeight: 1.33,
        letterSpacing: '0.5px',
      },
      labelSmall: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: '0.6875rem',
        lineHeight: 1.45,
        letterSpacing: '0.5px',
      },
      bodyLarge: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '1rem',
        lineHeight: 1.5,
        letterSpacing: '0.5px',
      },
      bodyMedium: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '0.875rem',
        lineHeight: 1.43,
        letterSpacing: '0.25px',
      },
      bodySmall: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 400,
        fontSize: '0.75rem',
        lineHeight: 1.33,
        letterSpacing: '0.4px',
      },
    },
    shape: {
      borderRadius: 12, // MD3 default border radius
    },
    components: {
      // Material Design 3 Component Customizations
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.background,
            color: colors.onBackground,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '20px',
            fontWeight: 500,
            fontSize: '0.875rem',
            letterSpacing: '0.1px',
            padding: '10px 24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: mode === 'light' 
                ? '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)'
                : '0px 1px 3px rgba(255,255,255,0.12), 0px 1px 2px rgba(255,255,255,0.24)',
            },
          },
          contained: {
            backgroundColor: colors.primary,
            color: colors.onPrimary,
            '&:hover': {
              backgroundColor: mode === 'light' 
                ? `color-mix(in srgb, ${colors.primary} 85%, black)`
                : `color-mix(in srgb, ${colors.primary} 85%, white)`,
            },
          },
          outlined: {
            borderColor: colors.outline,
            color: colors.primary,
            '&:hover': {
              backgroundColor: `${colors.primary}08`,
              borderColor: colors.primary,
            },
          },
          text: {
            color: colors.primary,
            '&:hover': {
              backgroundColor: `${colors.primary}08`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
            borderRadius: '12px',
            border: `1px solid ${colors.outlineVariant}`,
            boxShadow: mode === 'light' 
              ? '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)'
              : '0px 1px 3px rgba(255,255,255,0.12), 0px 1px 2px rgba(255,255,255,0.24)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
            color: colors.onSurface,
            boxShadow: mode === 'light' 
              ? '0px 1px 3px rgba(0,0,0,0.12)'
              : '0px 1px 3px rgba(255,255,255,0.12)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '0.75rem',
            letterSpacing: '0.5px',
          },
          filled: {
            backgroundColor: colors.secondaryContainer,
            color: colors.onSecondaryContainer,
          },
          outlined: {
            borderColor: colors.outline,
            color: colors.onSurface,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '4px',
              '& fieldset': {
                borderColor: colors.outline,
              },
              '&:hover fieldset': {
                borderColor: colors.onSurface,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.primary,
                borderWidth: '2px',
              },
            },
            '& .MuiInputLabel-root': {
              color: colors.onSurfaceVariant,
              '&.Mui-focused': {
                color: colors.primary,
              },
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: colors.onSurfaceVariant,
              '&.Mui-selected': {
                color: colors.primary,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: colors.primary,
              height: '3px',
              borderRadius: '3px',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: colors.onSurfaceVariant,
            '&:hover': {
              backgroundColor: `${colors.onSurface}08`,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
            color: colors.onSurface,
          },
        },
      },
    },
  });
};

export default createMD3Theme;
