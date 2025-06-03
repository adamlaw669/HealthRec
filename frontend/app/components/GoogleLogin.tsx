'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';

export default function GoogleLoginComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      const tokenClient = window.google.accounts.oauth2.initCodeClient({
        client_id: '544730488651-rsgigbm1dfciek9q0d9pkt4mbr11s1tr.apps.googleusercontent.com',
        scope: `
          openid email profile
          https://www.googleapis.com/auth/fitness.activity.read
          https://www.googleapis.com/auth/fitness.heart_rate.read
          https://www.googleapis.com/auth/fitness.sleep.read
          https://www.googleapis.com/auth/fitness.body.read
        `.replace(/\s+/g, ' '),
        ux_mode: 'popup',
        callback: async (response: google.accounts.oauth2.CodeResponse) => {
          if (response.code) {
            try {
              const data = await authAPI.googleCallback(response.code);
              
              if (data.token) {
                localStorage.setItem('token', data.token);
                if (data.refresh) {
                  localStorage.setItem('refresh', data.refresh);
                }
                
                const userData = {
                  username: data.user.username,
                  name: data.user.name || data.user.username.split('@')[0],
                  email: data.user.username
                };
                localStorage.setItem('user', JSON.stringify(userData));
                navigate('/dashboard');
              } else {
                throw new Error(data.error || 'Authentication failed');
              }
            } catch (error) {
              console.error('Google login error:', error);
              alert(error instanceof Error ? error.message : 'Authentication failed');
            }
          }
        },
      });

      const loginBtn = document.getElementById('google-fit-btn');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => {
          tokenClient.requestCode();
        });
      }
    }
  }, [navigate]);

  return (
    <button
      id="google-fit-btn"
      className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
    >
      Continue with Google
    </button>
  );
}