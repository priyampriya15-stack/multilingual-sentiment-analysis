import React from 'react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return children ? <>{children}</> : null;
};

export default ProtectedRoute;
