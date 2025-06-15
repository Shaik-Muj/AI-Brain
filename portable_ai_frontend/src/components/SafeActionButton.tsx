// SafeActionButton.tsx - A button wrapper that prevents blank screens
import React, { useState } from 'react';

interface SafeActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * A button component that prevents the UI from becoming unresponsive
 * by catching errors and providing fallback handling
 */
const SafeActionButton: React.FC<SafeActionButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  children
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSafeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Don't do anything if already processing or disabled
    if (isProcessing || disabled) {
      return;
    }

    setIsProcessing(true);

    // Use try-catch with setTimeout to ensure the UI doesn't freeze
    try {
      // Use setTimeout to prevent blocking the UI thread
      setTimeout(() => {
        try {
          // Call the original onClick handler
          onClick();
        } catch (error) {
          console.error('Error in SafeActionButton onClick handler:', error);
        } finally {
          // Always reset processing state, even if there's an error
          setIsProcessing(false);
        }
      }, 10);
    } catch (error) {
      console.error('Error in SafeActionButton:', error);
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleSafeClick}
      disabled={disabled || isProcessing}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
};

export default SafeActionButton;
