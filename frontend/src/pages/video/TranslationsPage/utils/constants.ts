import {
  Translate,
  History,
  CreditCard,
  Description,
  LiveHelp,
  ContactSupport,
} from '@mui/icons-material';

/**
 * Constants for Translations Page
 */

export const DRAWER_WIDTH = 280;

// Menu items configuration
export const menuItemsConfig = [
  {
    id: 'translate',
    label: 'Translate',
    iconComponent: Translate,
    section: 'Translate',
  },
  {
    id: 'history',
    label: 'Translation History',
    iconComponent: History,
    section: 'Translate',
  },
  {
    id: 'credits',
    label: 'Credits',
    iconComponent: CreditCard,
    section: 'Credits',
  },
  {
    id: 'documentation',
    label: 'Documentation',
    iconComponent: Description,
    section: 'Help & Support',
  },
  {
    id: 'faq',
    label: 'FAQ',
    iconComponent: LiveHelp,
    section: 'Help & Support',
  },
  {
    id: 'support',
    label: 'Support',
    iconComponent: ContactSupport,
    section: 'Help & Support',
  },
];

export const menuSections = ['Translate', 'Credits', 'Help & Support'];
