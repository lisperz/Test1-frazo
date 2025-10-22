import {
  Translate,
  History,
  CreditCard,
  Description,
  LiveHelp,
  ContactSupport,
} from '@mui/icons-material';
import { MenuItem } from '../types';

export const useMenuItems = (): MenuItem[] => {
  return [
    {
      id: 'translate',
      label: 'Translate',
      icon: <Translate />,
      section: 'Translate',
    },
    {
      id: 'history',
      label: 'Translation History',
      icon: <History />,
      section: 'Translate',
    },
    {
      id: 'credits',
      label: 'Credits',
      icon: <CreditCard />,
      section: 'Credits',
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: <Description />,
      section: 'Help & Support',
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: <LiveHelp />,
      section: 'Help & Support',
    },
    {
      id: 'support',
      label: 'Support',
      icon: <ContactSupport />,
      section: 'Help & Support',
    },
  ];
};
