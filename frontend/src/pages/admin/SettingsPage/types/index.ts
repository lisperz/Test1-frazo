export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  jobComplete: boolean;
  jobFailed: boolean;
  creditLow: boolean;
  newsletter: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at: string | null;
}

export interface CreditTransaction {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  description: string;
  balance_after: number;
}

export interface SubscriptionPlan {
  name: string;
  price: string;
  credits: string;
  current: boolean;
}

import React from 'react';

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  jobComplete: boolean;
  jobFailed: boolean;
  creditLow: boolean;
  newsletter: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at: string | null;
}

export interface CreditTransaction {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  description: string;
  balance_after: number;
}

export interface SubscriptionPlan {
  name: string;
  price: string;
  credits: string;
  current: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactElement;
}
