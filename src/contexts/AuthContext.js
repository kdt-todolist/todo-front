import React, { createContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // URL에서 accessToken 추출
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // accessToken을 localStorage에 저장하거나 상태로 관리
      localStorage.setItem('accessToken', token);
      console.log('token:', token);
      setAccessToken(token);
      setIsAuthenticated(true);
      navigate('/'); // 로그인 후 대시보드로 리다이렉트
    }
  }, [location, navigate]);

  const logout = () => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ accessToken, user, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
