// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getToken, setToken, clearToken, getUser, setUser, clearUser } from '../utils/storage';
import ApiService from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUserState] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      const token = await getToken();
      const userData = await getUser();

      if (token && userData) {
        setIsLoggedIn(true);
        setUserState(userData);
      }

      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (username, password) => {
    const res = await ApiService.login(username, password);
    if (res?.access_token) {
      await setToken(res.access_token);
      await setUser(res.user);
      setUserState(res.user);
      setIsLoggedIn(true);
    }
  };

  const logout = async () => {
    await clearToken();
    await clearUser();
    setIsLoggedIn(false);
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
