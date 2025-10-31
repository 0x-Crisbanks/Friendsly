import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import AuthPrompt from './AuthPrompt';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useWeb3();

  if (!isAuthenticated) {
    return <AuthPrompt />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;