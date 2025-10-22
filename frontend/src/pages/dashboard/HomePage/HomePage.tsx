/**
 * Home Page - Landing page for the application
 */

import React from 'react';
import { Box, Container } from '@mui/material';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import PricingSection from './components/PricingSection';
import CTASection from './components/CTASection';

const HomePage: React.FC = () => {
  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <Container maxWidth="lg">
        <FeaturesSection />
      </Container>

      {/* Pricing Section */}
      <Container maxWidth="lg">
        <PricingSection />
      </Container>

      {/* CTA Section */}
      <Container maxWidth="lg">
        <CTASection />
      </Container>
    </Box>
  );
};

export default HomePage;
