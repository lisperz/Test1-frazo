import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../contexts/AuthContext';
import { usersApi } from '../../../../services/api';
import { ProfileData, PasswordData, NotificationSettings } from '../types';

export const useSettings = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKeyDialog, setNewApiKeyDialog] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [generatedApiKey, setGeneratedApiKey] = useState('');

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    company: user?.company || '',
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    jobComplete: true,
    jobFailed: true,
    creditLow: true,
    newsletter: false,
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: usersApi.getApiKeys,
  });

  const { data: creditHistory = [] } = useQuery({
    queryKey: ['credit-history'],
    queryFn: () => usersApi.getCreditHistory({ limit: 10 }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<ProfileData>) => usersApi.updateProfile(data),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      usersApi.changePassword(data),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: (name: string) => usersApi.createApiKey(name),
    onSuccess: (data) => {
      setGeneratedApiKey(data.key);
      setNewApiKeyDialog(false);
      setNewApiKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: (keyId: string) => usersApi.deleteApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      company: profileData.company,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }
    changePasswordMutation.mutate({
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
    });
  };

  const handleCreateApiKey = () => {
    if (newApiKeyName.trim()) {
      createApiKeyMutation.mutate(newApiKeyName.trim());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return {
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
  };
};
