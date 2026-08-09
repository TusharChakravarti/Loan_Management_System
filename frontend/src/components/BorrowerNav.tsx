'use client';

import React from 'react';
import { CredoraHeader } from './CredoraHeader';

interface BorrowerNavProps {
  title?: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}

export const BorrowerNav: React.FC<BorrowerNavProps> = ({
  title = 'Borrower Portal',
  subtitle = 'Digital Lending & Loan Tracking',
  onMobileMenuToggle,
}) => {
  return (
    <CredoraHeader
      title={title}
      subtitle={subtitle}
      onMobileMenuToggle={onMobileMenuToggle}
    />
  );
};
