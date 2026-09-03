import React, { createContext, useContext } from 'react';

const AuthContext = createContext<{ onAuthenticated: () => void }>({
  onAuthenticated: () => undefined,
});

export function AuthProvider({
  children,
  onAuthenticated,
}: {
  children: React.ReactNode;
  onAuthenticated: () => void;
}): React.JSX.Element {
  return (
    <AuthContext.Provider value={{ onAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): { onAuthenticated: () => void } {
  return useContext(AuthContext);
}
