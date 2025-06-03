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
        callback: async (response: any) => {
          if (response.code) {
            try {
              const result = await authAPI.googleCallback(response.code);
              if (result.token && result.user) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                // Add a small delay to ensure storage is complete
                setTimeout(() => {
                  navigate('/dashboard');
                }, 100);
              } else {
                console.error('Invalid response format:', result);
                alert('Login failed: Invalid response from server');
              }
            } catch (error) {
              console.error('Google callback error:', error);
              alert('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
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