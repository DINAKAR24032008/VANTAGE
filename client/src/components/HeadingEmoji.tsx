import React from 'react';

interface Props {
  emoji: string;
  className?: string;
}

export const HeadingEmoji: React.FC<Props> = ({ emoji, className = '' }) => {
  return (
    <span
      aria-hidden="true"
      className={`mr-2.5 inline-flex items-center justify-center align-middle select-none ${className}`}
    >
      {emoji}
    </span>
  );
};
