'use client';
import { icons, type LucideProps, HelpCircle } from 'lucide-react';

interface LucideIconProps extends LucideProps {
  name: string | null | undefined;
}

const LucideIcon = ({ name, ...props }: LucideIconProps) => {
  if (!name) {
    return <HelpCircle {...props} />;
  }

  const IconComponent = (icons as any)[name];

  if (!IconComponent) {
    return <HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
};

export default LucideIcon;
