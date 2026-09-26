import React, { createContext, useContext } from 'react';

interface AuthContextValue {
  onAuthenticated: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  onAuthenticated: () => undefined,
  signOut: () => undefined,
});

export function AuthProvider({
  children,
  onAuthenticated,
  signOut,
}: {
  children: React.ReactNode;
  onAuthenticated: () => void;
  signOut: () => void;
}): React.JSX.Element {
  return (
    <AuthContext.Provider value={{ onAuthenticated, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
