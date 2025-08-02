import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  PlayCircleOutline,
  AutoFixHigh,
  Speed,
  Security,
  CloudUpload,
  Check,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <AutoFixHigh color="primary" />,
      title: 'AI-Powered Text Removal',
      description: 'Advanced AI automatically detects and removes text from videos with precision.',
    },
    {
      icon: <Speed color="primary" />,
      title: 'Fast Processing',
      description: 'Get your processed videos in minutes, not hours.',
    },
    {
      icon: <Security color="primary" />,
      title: 'Secure & Private',
      description: 'Your videos are processed securely and deleted after completion.',
    },
    {
      icon: <CloudUpload color="primary" />,
      title: 'Easy Upload',
      description: 'Simple drag-and-drop interface supports all major video formats.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      credits: '100 credits',
      features: [
        'Up to 5-minute videos',
        'Basic text removal',
        '100MB file limit',
        'Standard processing',
      ],
    },
    {
      name: 'Pro',
      price: '$29.99',
      period: '/month',
      credits: '1,000 credits',
      features: [
        'Up to 30-minute videos',
        'Advanced text removal',
        '500MB file limit',
        'Priority processing',
        'API access',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$99.99',
      period: '/month',
      credits: '5,000 credits',
      features: [
        'Unlimited video length',
        'Custom models',
        '2GB file limit',
        'Dedicated support',
        'API access',
        'Bulk processing',
      ],
    },
  ];

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ pt: 8, pb: 6, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Professional Video Text Inpainting
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            Remove text, subtitles, and watermarks from your videos using advanced AI technology
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayCircleOutline />}
              onClick={() => navigate('/register')}
              sx={{ px: 4, py: 1.5 }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ px: 4, py: 1.5 }}
            >
              Sign In
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ mb: 6, fontWeight: 600 }}
          >
            Why Choose Our Service?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ mr: 2, fontSize: 40 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" component="h3" fontWeight={600}>
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Pricing Section */}
        <Box sx={{ py: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ mb: 6, fontWeight: 600 }}
          >
            Choose Your Plan
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {pricingPlans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper
                  elevation={plan.popular ? 8 : 2}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    position: 'relative',
                    height: '100%',
                    border: plan.popular ? '2px solid' : 'none',
                    borderColor: plan.popular ? 'primary.main' : 'transparent',
                  }}
                >
                  {plan.popular && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        px: 3,
                        py: 0.5,
                        borderRadius: 20,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      Most Popular
                    </Box>
                  )}
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {plan.name}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h3"
                      component="span"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {plan.price}
                    </Typography>
                    <Typography variant="body1" component="span" color="text.secondary">
                      {plan.period}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" color="primary.main" gutterBottom>
                    {plan.credits}
                  </Typography>
                  <List sx={{ mb: 3 }}>
                    {plan.features.map((feature, featureIndex) => (
                      <ListItem key={featureIndex} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Check color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    variant={plan.popular ? 'contained' : 'outlined'}
                    fullWidth
                    size="large"
                    onClick={() => navigate('/register')}
                  >
                    Get Started
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Paper
            sx={{
              p: 6,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Ready to Remove Text from Your Videos?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of content creators using our AI-powered service
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
                px: 4,
                py: 1.5,
              }}
            >
              Start Free Trial
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;