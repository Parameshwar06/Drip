import { createTheme } from '@mui/material/styles';

// Apple-inspired glassmorphic color palette
const glassmorphicTheme = {
  light: {
    primary: {
      main: '#007AFF',
      light: '#5AC8FA',
      dark: '#0051D5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF3B30',
      light: '#FF453A',
      dark: '#D70015',
      contrastText: '#FFFFFF',
    },
    accent: {
      purple: '#AF52DE',
      pink: '#FF2D92',
      orange: '#FF9500',
      green: '#30D158',
      cyan: '#5AC8FA',
      indigo: '#5856D6',
    },
    background: {
      default: 'rgba(248, 248, 248, 0.8)',
      paper: 'rgba(255, 255, 255, 0.7)',
      glass: 'rgba(255, 255, 255, 0.25)',
      glassStrong: 'rgba(255, 255, 255, 0.4)',
      gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
      blur: 'blur(20px)',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    border: {
      light: 'rgba(255, 255, 255, 0.18)',
      medium: 'rgba(255, 255, 255, 0.3)',
      strong: 'rgba(255, 255, 255, 0.5)',
    },
    shadow: {
      glass: '0 8px 32px rgba(31, 38, 135, 0.15)',
      glassStrong: '0 8px 32px rgba(31, 38, 135, 0.25)',
      colored: '0 8px 32px rgba(0, 122, 255, 0.15)',
    }
  },
  dark: {
    primary: {
      main: '#0A84FF',
      light: '#64D2FF',
      dark: '#0056CC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF453A',
      light: '#FF6961',
      dark: '#D70015',
      contrastText: '#FFFFFF',
    },
    accent: {
      purple: '#BF5AF2',
      pink: '#FF375F',
      orange: '#FF9F0A',
      green: '#32D74B',
      cyan: '#64D2FF',
      indigo: '#5E5CE6',
    },
    background: {
      default: 'rgba(0, 0, 0, 0.9)',
      paper: 'rgba(28, 28, 30, 0.8)',
      glass: 'rgba(255, 255, 255, 0.05)',
      glassStrong: 'rgba(255, 255, 255, 0.1)',
      gradient: 'linear-gradient(135deg, rgba(28, 28, 30, 0.95) 0%, rgba(44, 44, 46, 0.85) 100%)',
      blur: 'blur(20px)',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      disabled: 'rgba(255, 255, 255, 0.38)',
    },
    border: {
      light: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.15)',
      strong: 'rgba(255, 255, 255, 0.25)',
    },
    shadow: {
      glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
      glassStrong: '0 8px 32px rgba(0, 0, 0, 0.5)',
      colored: '0 8px 32px rgba(10, 132, 255, 0.25)',
    }
  }
};

export const createGlassmorphicTheme = (mode) => {
  const colors = glassmorphicTheme[mode];
  
  return createTheme({
    palette: {
      mode,
      ...colors,
      background: {
        default: mode === 'light' ? '#F2F2F7' : '#000000',
        paper: colors.background.paper,
      },
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.accent.purple} 100%)`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.015em',
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            background: colors.background.gradient,
            backdropFilter: colors.background.blur,
            border: `1px solid ${colors.border.light}`,
            boxShadow: colors.shadow.glass,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: colors.shadow.glassStrong,
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: colors.background.gradient,
            backdropFilter: colors.background.blur,
            border: `1px solid ${colors.border.light}`,
            boxShadow: colors.shadow.glass,
            borderRadius: 20,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${colors.border.medium}, transparent)`,
            },
            '&:hover': {
              boxShadow: colors.shadow.glassStrong,
              transform: 'translateY(-4px) scale(1.02)',
              border: `1px solid ${colors.border.medium}`,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            padding: '12px 24px',
            backdropFilter: colors.background.blur,
            border: `1px solid ${colors.border.light}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: colors.shadow.colored,
            },
          },
          contained: {
            background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
            boxShadow: colors.shadow.colored,
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.primary.main} 100%)`,
              boxShadow: `0 12px 40px ${colors.primary.main}40`,
            },
          },
          outlined: {
            background: colors.background.glass,
            backdropFilter: colors.background.blur,
            border: `1px solid ${colors.border.medium}`,
            '&:hover': {
              background: colors.background.glassStrong,
              border: `1px solid ${colors.border.strong}`,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              background: colors.background.glass,
              backdropFilter: colors.background.blur,
              borderRadius: 12,
              border: `1px solid ${colors.border.light}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: colors.background.glassStrong,
                border: `1px solid ${colors.border.medium}`,
              },
              '&.Mui-focused': {
                background: colors.background.glassStrong,
                border: `1px solid ${colors.primary.main}`,
                boxShadow: `0 0 0 3px ${colors.primary.main}20`,
              },
              '& fieldset': {
                border: 'none',
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: colors.background.gradient,
            backdropFilter: colors.background.blur,
            border: `1px solid ${colors.border.light}`,
            boxShadow: colors.shadow.glass,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            background: colors.background.gradient,
            backdropFilter: colors.background.blur,
            border: `1px solid ${colors.border.medium}`,
            boxShadow: colors.shadow.glassStrong,
          },
        },
      },
    },
  });
};
