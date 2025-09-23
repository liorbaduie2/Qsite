// components/AuthStatusDisplay.tsx
'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import LoginStatusMessage from './LoginStatusMessage';

interface AuthStatusDisplayProps {
  className?: string;
  showOnlyErrors?: boolean;
  dismissible?: boolean;
  autoHide?: number; // Auto hide after X milliseconds
}

const AuthStatusDisplay: React.FC<AuthStatusDisplayProps> = ({
  className = "",
  showOnlyErrors = false,
  dismissible = true,
  autoHide
}) => {
  const { error, loginStatus, clearError } = useAuth();
  const [dismissed, setDismissed] = React.useState(false);

  // Auto hide functionality
  React.useEffect(() => {
    if (autoHide && (error || loginStatus)) {
      const timer = setTimeout(() => {
        setDismissed(true);
      }, autoHide);

      return () => clearTimeout(timer);
    }
  }, [error, loginStatus, autoHide]);

  // Reset dismissed state when new error/status appears
  React.useEffect(() => {
    if (error || loginStatus) {
      setDismissed(false);
    }
  }, [error, loginStatus]);

  const handleDismiss = () => {
    setDismissed(true);
    if (dismissible) {
      clearError();
    }
  };

  // Determine what to display
  const getDisplayInfo = () => {
    // Priority: loginStatus over generic error
    if (loginStatus && !loginStatus.can_login) {
      return {
        status: loginStatus.status,
        message: loginStatus.message_hebrew
      };
    }
    
    if (error) {
      // Try to determine status from error message
      if (error.includes('לא אושר') || error.includes('ממתין')) {
        return { status: 'pending' as const, message: error };
      }
      if (error.includes('נדחה')) {
        return { status: 'rejected' as const, message: error };
      }
      if (error.includes('הושעה')) {
        return { status: 'suspended' as const, message: error };
      }
      
      // Generic error
      if (!showOnlyErrors) {
        return { status: 'error' as const, message: error };
      }
    }
    
    return null;
  };

  const displayInfo = getDisplayInfo();

  // Don't render if dismissed or no status to show
  if (dismissed || !displayInfo) {
    return null;
  }

  return (
    <div className={className}>
      <LoginStatusMessage
        status={displayInfo.status}
        message={displayInfo.message}
        onDismiss={dismissible ? handleDismiss : undefined}
      />
    </div>
  );
};

export default AuthStatusDisplay;

// Hook for easy access to auth status in other components
export const useAuthStatus = () => {
  const { error, loginStatus, clearError } = useAuth();

  const getStatus = React.useCallback(() => {
    if (loginStatus && !loginStatus.can_login) {
      return {
        hasStatus: true,
        status: loginStatus.status,
        message: loginStatus.message_hebrew,
        canLogin: false
      };
    }
    
    if (error) {
      let status: 'pending' | 'rejected' | 'suspended' | 'error' = 'error';
      
      if (error.includes('לא אושר') || error.includes('ממתין')) {
        status = 'pending';
      } else if (error.includes('נדחה')) {
        status = 'rejected';
      } else if (error.includes('הושעה')) {
        status = 'suspended';
      }
      
      return {
        hasStatus: true,
        status,
        message: error,
        canLogin: false
      };
    }
    
    return {
      hasStatus: false,
      status: null,
      message: null,
      canLogin: true
    };
  }, [error, loginStatus]);

  return {
    ...getStatus(),
    clearError
  };
};