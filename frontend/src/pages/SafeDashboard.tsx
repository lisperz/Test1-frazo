import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Avatar
} from '@mui/material';
import {
  VideoLibrary,
  Upload,
  Work
} from '@mui/icons-material';

const SafeDashboard: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[SafeDashboard] Component mounted');
    console.log('[SafeDashboard] Current user from localStorage:', localStorage.getItem('user'));
    console.log('[SafeDashboard] Access token exists:', !!localStorage.getItem('access_token'));
    
    return () => {
      console.log('[SafeDashboard] Component unmounting');
    };
  }, []);

  const handleNavigation = (path: string) => {
    console.log(`[SafeDashboard] Navigating to: ${path}`);
    navigate(path);
  };


  const toolCards = [
    {
      title: 'Video Text Removal',
      subtitle: 'Smart text erasure processing',
      description: 'Remove text, subtitles, and watermarks from videos with one click',
      icon: <VideoLibrary sx={{ fontSize: 28 }} />,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      action: () => handleNavigation('/editor'),
      featured: true
    },
    {
      title: 'Upload Video',
      subtitle: 'Fast file upload',
      description: 'Support multiple video format uploads',
      icon: <Upload sx={{ fontSize: 28 }} />,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      action: () => handleNavigation('/upload')
    },
    {
      title: 'Task Management',
      subtitle: 'Processing progress view',
      description: 'View processing history and status',
      icon: <Work sx={{ fontSize: 28 }} />,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      action: () => handleNavigation('/jobs')
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      width: '100%'  // Take full available width from flex container
    }}>
      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, rgba(102,126,234,0.9) 0%, rgba(118,75,162,0.9) 100%)',
        pt: 8, pb: 6, color: 'white' 
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ 
              fontWeight: 700, 
              mb: 2, 
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              One-Stop Video Processing Platform
            </Typography>
            <Typography variant="h6" sx={{ 
              mb: 4, 
              opacity: 0.9,
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontWeight: 300
            }}>
              Covering subtitle timing, erasure, translation, proofreading, dubbing, rendering and all other localization processes with one-stop batch processing experience.
            </Typography>
            <Button 
              variant="contained"
              size="large"
              onClick={() => handleNavigation('/editor')}
              sx={{
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                borderRadius: '25px',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 8px 32px rgba(254,107,139,0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(254,107,139,0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* AI Tools Section */}
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          mb: 4, 
          color: '#2d3748',
          textAlign: 'center'
        }}>
          AI Tools
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {toolCards.map((tool, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                onClick={tool.action}
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                  },
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        background: tool.color,
                        width: 48, 
                        height: 48, 
                        mr: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    >
                      {tool.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        color: '#2d3748',
                        mb: 0.5,
                        fontSize: '1.1rem'
                      }}>
                        {tool.title}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#718096',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}>
                        {tool.subtitle}
                      </Typography>
                    </Box>
                    {tool.featured && (
                      <Box sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        Popular
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ 
                    color: '#4a5568',
                    lineHeight: 1.6
                  }}>
                    {tool.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

      </Container>
    </Box>
  );
};

export default SafeDashboard;