import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { createGlassmorphicTheme } from './glassmorphicTheme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const globalStyles = (theme) => ({
  '*': {
    boxSizing: 'border-box',
  },
  'html, body': {
    margin: 0,
    padding: 0,
    height: '100%',
    fontFamily: theme.typography.fontFamily,
  },
  body: {
    background: theme.palette.mode === 'light' 
      ? `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%),
        linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%)
      `
      : `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%),
        linear-gradient(135deg, #000000 0%, #1C1C1E 100%)
      `,
    minHeight: '100vh',
    overflow: 'hidden',
    position: 'relative',
  },
  '#root': {
    height: '100%',
    overflow: 'auto',
  },
  // Glassmorphic scrollbar
  '::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '::-webkit-scrollbar-thumb': {
    background: theme.palette.mode === 'light' 
      ? 'rgba(0, 0, 0, 0.2)' 
      : 'rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    backdropFilter: 'blur(10px)',
  },
  '::-webkit-scrollbar-thumb:hover': {
    background: theme.palette.mode === 'light' 
      ? 'rgba(0, 0, 0, 0.3)' 
      : 'rgba(255, 255, 255, 0.3)',
  },
  // Liquid glass animations
  '@keyframes liquidFloat': {
    '0%, 100%': {
      transform: 'translateY(0px) rotate(0deg)',
    },
    '50%': {
      transform: 'translateY(-20px) rotate(180deg)',
    },
  },
  '@keyframes liquidPulse': {
    '0%, 100%': {
      transform: 'scale(1)',
      opacity: 0.8,
    },
    '50%': {
      transform: 'scale(1.05)',
      opacity: 1,
    },
  },
  '@keyframes liquidGlow': {
    '0%, 100%': {
      boxShadow: `0 0 20px ${theme.palette.primary.main}30`,
    },
    '50%': {
      boxShadow: `0 0 40px ${theme.palette.primary.main}60`,
    },
  },
  // Animated background elements
  'body::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: theme.palette.mode === 'light'
      ? `
        radial-gradient(circle at 10% 20%, rgba(0, 122, 255, 0.1) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, rgba(175, 82, 222, 0.1) 0%, transparent 20%),
        radial-gradient(circle at 50% 50%, rgba(255, 149, 0, 0.1) 0%, transparent 20%)
      `
      : `
        radial-gradient(circle at 10% 20%, rgba(10, 132, 255, 0.15) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, rgba(191, 90, 242, 0.15) 0%, transparent 20%),
        radial-gradient(circle at 50% 50%, rgba(255, 159, 10, 0.15) 0%, transparent 20%)
      `,
    animation: 'liquidFloat 8s ease-in-out infinite',
    pointerEvents: 'none',
    zIndex: -1,
  },
  'body::after': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: theme.palette.mode === 'light'
      ? `
        radial-gradient(circle at 30% 70%, rgba(90, 200, 250, 0.08) 0%, transparent 25%),
        radial-gradient(circle at 70% 30%, rgba(255, 45, 146, 0.08) 0%, transparent 25%)
      `
      : `
        radial-gradient(circle at 30% 70%, rgba(100, 210, 255, 0.12) 0%, transparent 25%),
        radial-gradient(circle at 70% 30%, rgba(255, 55, 95, 0.12) 0%, transparent 25%)
      `,
    animation: 'liquidFloat 12s ease-in-out infinite reverse',
    pointerEvents: 'none',
    zIndex: -1,
  },
});

export const GlassmorphicThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  const theme = createGlassmorphicTheme(mode);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  useEffect(() => {
    // Auto-detect system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('themeMode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const contextValue = {
    mode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={globalStyles(theme)} />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
