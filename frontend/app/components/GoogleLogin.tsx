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
      type="button"
      className="w-full h-11 inline-flex items-center justify-center gap-2.5 rounded-xl bg-card border border-border font-semibold text-sm text-foreground hover:bg-secondary transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
      </svg>
      Continue with Google
    </button>
  );
}
