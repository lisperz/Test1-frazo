import React from 'react';
import { Container, Typography, Grid } from '@mui/material';
import {
  AccountCircle,
  Security,
  Key,
  CreditCard,
  Notifications,
} from '@mui/icons-material';
import {
  ProfileSection,
  SecuritySection,
  ApiKeysSection,
  BillingSection,
  NotificationsSection,
  SettingsSidebar,
  CreateApiKeyDialog,
} from './components';
import { useSettings } from './hooks/useSettings';
import { SubscriptionPlan, TabItem } from './types';

const SettingsPage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    showApiKey,
    setShowApiKey,
    newApiKeyDialog,
    setNewApiKeyDialog,
    newApiKeyName,
    setNewApiKeyName,
    generatedApiKey,
    profileData,
    setProfileData,
    passwordData,
    setPasswordData,
    notificationSettings,
    setNotificationSettings,
    apiKeys,
    creditHistory,
    updateProfileMutation,
    changePasswordMutation,
    createApiKeyMutation,
    deleteApiKeyMutation,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleCreateApiKey,
    copyToClipboard,
    user,
  } = useSettings();

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      name: 'Free',
      price: '$0/month',
      credits: '100 credits/month',
      current: user?.subscription_tier === 'free',
    },
    {
      name: 'Pro',
      price: '$29.99/month',
      credits: '1,000 credits/month',
      current: user?.subscription_tier === 'pro',
    },
    {
      name: 'Enterprise',
      price: '$99.99/month',
      credits: '5,000 credits/month',
      current: user?.subscription_tier === 'enterprise',
    },
  ];

  const tabItems: TabItem[] = [
    { id: 'profile', label: 'Profile', icon: <AccountCircle /> },
    { id: 'security', label: 'Security', icon: <Security /> },
    { id: 'api', label: 'API Keys', icon: <Key /> },
    { id: 'billing', label: 'Billing & Credits', icon: <CreditCard /> },
    { id: 'notifications', label: 'Notifications', icon: <Notifications /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Account Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your account preferences and settings
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <SettingsSidebar
            tabItems={tabItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </Grid>

        <Grid item xs={12} md={9}>
          {activeTab === 'profile' && (
            <ProfileSection
              profileData={profileData}
              onProfileChange={setProfileData}
              onSubmit={handleProfileSubmit}
              isLoading={updateProfileMutation.isPending}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySection
              passwordData={passwordData}
              onPasswordChange={setPasswordData}
              onSubmit={handlePasswordSubmit}
              isLoading={changePasswordMutation.isPending}
            />
          )}

          {activeTab === 'api' && (
            <ApiKeysSection
              apiKeys={apiKeys}
              generatedApiKey={generatedApiKey}
              showApiKey={showApiKey}
              onToggleShowApiKey={() => setShowApiKey(!showApiKey)}
              onCopyApiKey={copyToClipboard}
              onDeleteApiKey={(keyId) => deleteApiKeyMutation.mutate(keyId)}
              onCreateApiKey={() => setNewApiKeyDialog(true)}
              isDeleting={deleteApiKeyMutation.isPending}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSection
              subscriptionPlans={subscriptionPlans}
              creditHistory={creditHistory}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSection
              settings={notificationSettings}
              onSettingsChange={setNotificationSettings}
              onSave={() => {}}
            />
          )}
        </Grid>
      </Grid>

      <CreateApiKeyDialog
        open={newApiKeyDialog}
        apiKeyName={newApiKeyName}
        onNameChange={setNewApiKeyName}
        onClose={() => setNewApiKeyDialog(false)}
        onCreate={handleCreateApiKey}
        isCreating={createApiKeyMutation.isPending}
      />
    </Container>
  );
};

export default SettingsPage;
