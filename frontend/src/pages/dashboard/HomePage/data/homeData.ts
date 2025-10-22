/**
 * Home Page Static Data - Features and Pricing Plans
 */

import {
  AutoFixHigh,
  Speed,
  Security,
  CloudUpload,
} from '@mui/icons-material';

export const features = [
  {
    icon: AutoFixHigh,
    title: 'AI-Powered Text Removal',
    description: 'Advanced AI automatically detects and removes text from videos with precision.',
  },
  {
    icon: Speed,
    title: 'Fast Processing',
    description: 'Get your processed videos in minutes, not hours.',
  },
  {
    icon: Security,
    title: 'Secure & Private',
    description: 'Your videos are processed securely and deleted after completion.',
  },
  {
    icon: CloudUpload,
    title: 'Easy Upload',
    description: 'Simple drag-and-drop interface supports all major video formats.',
  },
];

export const pricingPlans = [
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
