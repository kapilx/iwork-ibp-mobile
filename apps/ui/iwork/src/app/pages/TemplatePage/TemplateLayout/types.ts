import React from 'react';

export interface TemplateLayoutProps {
  title: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  loading?: boolean;
  error?: string;
}

export interface LoadingSkeletonProps {
  count?: number;
}