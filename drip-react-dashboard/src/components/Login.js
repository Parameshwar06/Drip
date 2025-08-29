import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Container,
  IconButton,
  InputAdornment
} from '@mui/material';
import { styled, keyframes } from '@mui/system';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';

// Animations
const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const shimmer = keyframes`
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-10px) rotate(1deg);
  }
  66% {
    transform: translateY(5px) rotate(-1deg);
  }
`;

// Styled Components
const LoginContainer = styled(Box)({
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7))',
  backdropFilter: 'blur(10px)',
  overflow: 'hidden',
});

const LoginCard = styled(Box)({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '24px',
  padding: '50px 40px',
  width: '420px',
  maxWidth: '90%',
  boxShadow: `
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.1)
  `,
  animation: `${slideUp} 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
  position: 'relative',
  overflow: 'hidden',
  textAlign: 'center',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
  },
  
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
    animation: `${shimmer} 3s infinite`,
    pointerEvents: 'none',
  },
});

const StyledTextField = styled(TextField)({
  marginBottom: '25px',
  
  '& .MuiOutlinedInput-root': {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    borderRadius: '18px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: 'white',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    
    '& fieldset': {
      border: 'none',
    },
    
    '&:hover': {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
      transform: 'translateY(-1px)',
    },
    
    '&.Mui-focused': {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
      boxShadow: `
        0 0 0 1px rgba(255, 255, 255, 0.1),
        0 12px 30px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.15)
      `,
      transform: 'translateY(-2px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    },
  },
  
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: 'rgba(255, 255, 255, 0.9)',
    },
  },
  
  '& .MuiOutlinedInput-input': {
    color: 'white',
    padding: '18px 24px',
    
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
      opacity: 1,
    },
  },
});

const LoginButton = styled(Button)({
  width: '100%',
  padding: '18px 24px',
  background: 'linear-gradient(135deg, rgba(103, 126, 234, 0.8), rgba(118, 75, 162, 0.8))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '18px',
  fontSize: '1.1em',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  position: 'relative',
  overflow: 'hidden',
  marginTop: '15px',
  boxShadow: '0 8px 25px rgba(103, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transition: 'left 0.6s ease',
  },
  
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(103, 126, 234, 0.9), rgba(118, 75, 162, 0.9))',
    transform: 'translateY(-3px)',
    boxShadow: `
      0 15px 35px rgba(103, 126, 234, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 0 20px rgba(255, 255, 255, 0.1)
    `,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    
    '&::before': {
      left: '100%',
    },
  },
  
  '&:active': {
    transform: 'translateY(-1px)',
    boxShadow: '0 8px 20px rgba(103, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  },
});

const GlassOrb = styled(Box)(({ size, top, left, right, bottom, delay }) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  backdropFilter: 'blur(15px)',
  WebkitBackdropFilter: 'blur(15px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  animation: `${float} 6s ease-in-out infinite`,
  animationDelay: delay,
  pointerEvents: 'none',
  ...(top && { top }),
  ...(left && { left }),
  ...(right && { right }),
  ...(bottom && { bottom }),
}));

const BackButton = styled(IconButton)({
  position: 'absolute',
  top: '30px',
  left: '30px',
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: 'white',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-2px)',
  },
});

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginContainer>
      {/* Floating Glass Orbs */}
      <GlassOrb size="80px" top="10%" left="10%" delay="0s" />
      <GlassOrb size="60px" top="70%" right="15%" delay="2s" />
      <GlassOrb size="100px" bottom="20%" left="5%" delay="4s" />
      
      {/* Back Button */}
      <BackButton onClick={() => navigate('/')}>
        <ArrowBack />
      </BackButton>
      
      <Container maxWidth="sm">
        <LoginCard>
          <Typography 
            variant="h3" 
            sx={{ 
              marginBottom: '10px',
              background: 'linear-gradient(135deg, #ffffff, #e0e0e0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
            }}
          >
            Welcome Back
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              marginBottom: '30px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Sign in to access your Smart Irrigation dashboard
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ marginBottom: '20px', backgroundColor: 'rgba(211, 47, 47, 0.1)' }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <StyledTextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="outlined"
            />
            
            <StyledTextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <LoginButton
              type="submit"
              disabled={loading}
              fullWidth
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </LoginButton>
          </Box>
          
          <Typography 
            variant="body2" 
            sx={{ 
              marginTop: '20px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Don't have an account?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: '#677eea',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Sign up here
            </Link>
          </Typography>
        </LoginCard>
      </Container>
    </LoginContainer>
  );
}

export default Login;
