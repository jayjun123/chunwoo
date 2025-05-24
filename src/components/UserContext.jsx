import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeAuthState, getUserData, logout } from '../services/auth';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // {uid, email, ...}
  const [userData, setUserData] = useState(null); // Firestore users 정보
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const data = await getUserData(firebaseUser.uid);
        setUserData(data);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 