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
  InputAdornment,
  LinearProgress
} from '@mui/material';
import { styled, keyframes } from '@mui/system';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';

// Same animations as Login
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

// Styled Components (reusing from Login with small modifications)
const RegisterContainer = styled(Box)({
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7))',
  backdropFilter: 'blur(10px)',
  overflow: 'hidden',
  padding: '20px 0',
});

const RegisterCard = styled(Box)({
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
  marginBottom: '20px',
  
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
    padding: '16px 20px',
    
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
      opacity: 1,
    },
  },
});

const RegisterButton = styled(Button)({
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

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    return strength;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password should be at least 6 characters');
    }
    
    try {
      setError('');
      setLoading(true);
      await signup(formData.email, formData.password, formData.name);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to create account: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function getPasswordStrengthColor() {
    if (passwordStrength < 50) return '#f44336';
    if (passwordStrength < 75) return '#ff9800';
    return '#4caf50';
  }

  return (
    <RegisterContainer>
      {/* Floating Glass Orbs */}
      <GlassOrb size="80px" top="10%" left="10%" delay="0s" />
      <GlassOrb size="60px" top="70%" right="15%" delay="2s" />
      <GlassOrb size="100px" bottom="20%" left="5%" delay="4s" />
      
      {/* Back Button */}
      <BackButton onClick={() => navigate('/')}>
        <ArrowBack />
      </BackButton>
      
      <Container maxWidth="sm">
        <RegisterCard>
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
            Join Smart Irrigation
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              marginBottom: '30px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Create your account to start monitoring your irrigation system
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ marginBottom: '20px', backgroundColor: 'rgba(211, 47, 47, 0.1)' }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <StyledTextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              variant="outlined"
            />
            
            <StyledTextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              variant="outlined"
            />
            
            <StyledTextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
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
            
            {formData.password && (
              <Box sx={{ marginBottom: '20px' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Password Strength: {passwordStrength}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={passwordStrength}
                  sx={{
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPasswordStrengthColor(),
                    },
                  }}
                />
              </Box>
            )}
            
            <StyledTextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <RegisterButton
              type="submit"
              disabled={loading}
              fullWidth
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </RegisterButton>
          </Box>
          
          <Typography 
            variant="body2" 
            sx={{ 
              marginTop: '20px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Already have an account?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: '#677eea',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Sign in here
            </Link>
          </Typography>
        </RegisterCard>
      </Container>
    </RegisterContainer>
  );
}

export default Register;
