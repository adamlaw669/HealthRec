'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
            console.log('Auth Code:', response.code);

            const res = await fetch('http://127.0.0.1:8000/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: response.code }),
            });

            const data = await res.json();

            if (res.ok) {
              const userData = {
                username: data.user.username,
                name: data.user.name || data.user.username.split('@')[0],
                email: data.user.username
              };
              localStorage.setItem('user', JSON.stringify(userData));
              window.location.href = 'http://127.0.0.1:8000/dashboard';
            } else {
              alert(data.error || 'Something went wrong during login.');
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
    const user = localStorage.getItem("user");  
    if (user){
      navigate('/dashboard');
    }
    }
  }, []);

  return (
    <button
      id="google-fit-btn"
      className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
    >
      Continue with Google
    </button>
  );
}