import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { styled, keyframes } from '@mui/system';

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
const LandingContainer = styled(Box)({
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7))',
  backdropFilter: 'blur(10px)',
  overflow: 'hidden',
});

const HeroCard = styled(Box)({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '32px',
  padding: '60px 50px',
  maxWidth: '900px',
  width: '90%',
  boxShadow: `
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.1)
  `,
  animation: `${slideUp} 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
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
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
  },
  
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
    animation: `${shimmer} 4s infinite`,
    pointerEvents: 'none',
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

const StyledButton = styled(Button)({
  padding: '18px 32px',
  fontSize: '1.1em',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '18px',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  color: 'white',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  position: 'relative',
  overflow: 'hidden',
  margin: '0 10px',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
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
    transform: 'translateY(-3px)',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))',
    boxShadow: `
      0 15px 35px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 0 20px rgba(255, 255, 255, 0.1)
    `,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    
    '&::before': {
      left: '100%',
    },
  },
});

const PrimaryButton = styled(StyledButton)({
  background: 'linear-gradient(135deg, rgba(103, 126, 234, 0.8), rgba(118, 75, 162, 0.8))',
  boxShadow: '0 8px 25px rgba(103, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(103, 126, 234, 0.9), rgba(118, 75, 162, 0.9))',
    boxShadow: `
      0 15px 35px rgba(103, 126, 234, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 0 20px rgba(255, 255, 255, 0.1)
    `,
    transform: 'translateY(-3px)',
  },
});

const TopNav = styled(Box)({
  position: 'absolute',
  top: '30px',
  right: '30px',
  zIndex: 10,
  display: 'flex',
  gap: '15px',
});

const NavButton = styled(Button)({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  padding: '8px 20px',
  color: 'white',
  fontSize: '0.9em',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-2px)',
  },
});

function LandingPage() {
  const navigate = useNavigate();

  return (
    <LandingContainer>
      {/* Floating Glass Orbs */}
      <GlassOrb size="120px" top="15%" left="10%" delay="0s" />
      <GlassOrb size="80px" top="60%" right="15%" delay="2s" />
      <GlassOrb size="100px" bottom="20%" left="8%" delay="4s" />
      <GlassOrb size="60px" top="30%" right="25%" delay="1s" />
      
      {/* Top Navigation */}
      <TopNav>
        <NavButton onClick={() => navigate('/login')}>
          Login
        </NavButton>
        <NavButton onClick={() => navigate('/register')}>
          Sign Up
        </NavButton>
      </TopNav>
      
      {/* Hero Content */}
      <Container maxWidth="lg">
        <HeroCard>
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #ffffff, #e0e0e0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              fontWeight: 700,
              letterSpacing: '-1px',
            }}
          >
            Welcome to Smart Irrigation
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              marginBottom: '35px',
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto 35px auto',
            }}
          >
            Revolutionizing farming with precision IoT technology. Monitor soil moisture, 
            control water flow, and optimize crop yields with real-time analytics and 
            intelligent automation.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton onClick={() => navigate('/dashboard')}>
              Get Started
            </PrimaryButton>
            <StyledButton onClick={() => navigate('/login')}>
              Login
            </StyledButton>
          </Box>
        </HeroCard>
      </Container>
    </LandingContainer>
  );
}

export default LandingPage;
