import React from 'react';

interface ExamSlotIconProps {
  className?: string;
  size?: number | string;
}

export const ExamSlotIcon: React.FC<ExamSlotIconProps> = ({
  className = 'w-9 h-9',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/examslot-icon.svg"
      alt="ExamSlot Icon"
      className={`shrink-0 select-none object-contain ${className}`}
      style={style}
    />
  );
};

interface ExamSlotLogoProps {
  className?: string;
  iconClassName?: string;
  showSubtitle?: boolean;
  lightText?: boolean;
}

export const ExamSlotLogo: React.FC<ExamSlotLogoProps> = ({
  className = '',
  lightText = false
}) => {
  if (lightText) {
    return (
      <div className={`inline-flex items-center bg-white px-3 py-1.5 rounded-2xl shadow-xs select-none ${className}`}>
        <img
          src="/examslot-logo.svg"
          alt="ExamSlot - University Examination Management System"
          className="h-7 sm:h-8 w-auto object-contain select-none"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/examslot-logo.svg"
        alt="ExamSlot - University Examination Management System"
        className="h-8 sm:h-9 w-auto object-contain select-none dark:bg-white/95 dark:px-2.5 dark:py-1 dark:rounded-xl"
      />
    </div>
  );
};
