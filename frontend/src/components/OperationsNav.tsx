'use client';

import React from 'react';
import { CredoraHeader } from './CredoraHeader';

interface OperationsNavProps {
  title: string;
  subtitle: string;
  onMobileMenuToggle?: () => void;
}

export const OperationsNav: React.FC<OperationsNavProps> = ({ title, subtitle, onMobileMenuToggle }) => {
  return (
    <CredoraHeader
      title={title}
      subtitle={subtitle}
      onMobileMenuToggle={onMobileMenuToggle}
      showOpsNav={true}
    />
  );
};
