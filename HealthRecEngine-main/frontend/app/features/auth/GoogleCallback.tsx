import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { googleCallback } from '../../api/api';

// Debug component to show logs in case of errors
interface DebugInfoProps {
  error: string | null;
  logs: string[];
}

const DebugInfo: React.FC<DebugInfoProps> = ({ error, logs }) => {
  if (!error) return null;
  
  return (
    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono max-h-[30vh] overflow-auto">
      <h3 className="text-red-500 mb-2">Error: {error}</h3>
      {logs.length > 0 && (
        <div>
          <h4 className="text-gray-700 dark:text-gray-300 mb-1">Debug logs:</h4>
          {logs.map((log, i) => (
            <div key={i} className="text-gray-600 dark:text-gray-400">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // First check if we have tokens directly in URL (server-side flow)
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        
        addLog(`Checking for tokens in URL: token=${!!token}, refresh=${!!refresh}`);
        addLog(`URL params: ${JSON.stringify(Object.fromEntries(searchParams.entries()))}`);
        
        if (token && refresh) {
          addLog('Tokens found in URL, storing directly');
          try {
            // First clear any existing tokens to avoid conflicts
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            
            // Store tokens in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('refresh', refresh);
            
            // Verify storage worked
            const storedToken = localStorage.getItem('token');
            const storedRefresh = localStorage.getItem('refresh');
            
            if (!storedToken || !storedRefresh) {
              throw new Error('Failed to store tokens in localStorage');
            }
            
            addLog('Authentication successful via redirect with tokens');
            
            // Allow a slight delay for token to be properly set before redirecting
            setTimeout(() => {
              navigate('/dashboard');
            }, 500);
            return;
          } catch (storageError: any) {
            addLog(`LocalStorage error: ${storageError.message}`);
            // Continue to code-based authentication as fallback
          }
        }
        
        // If no tokens, check for authorization code (client-side flow)
        const code = searchParams.get('code');
        addLog(`Authorization code present: ${!!code}`);
        
        if (!code) {
          throw new Error('No authorization code or tokens received');
        }

        addLog(`Exchanging code for token: ${code.substring(0, 10)}...`);
        const response = await googleCallback(code);
        addLog(`Response received with keys: ${Object.keys(response).join(', ')}`);
        
        if (response.token) {
          addLog('Token found in response, storing tokens');
          try {
            // First clear any existing tokens
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            
            // Store new tokens
            localStorage.setItem('token', response.token);
            if (response.refresh) {
              localStorage.setItem('refresh', response.refresh);
            }
            
            // Verify storage
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
              throw new Error('Failed to store token in localStorage');
            }
            
            addLog('Authentication successful via code exchange');
            
            // Allow a slight delay for token to be properly set before redirecting
            setTimeout(() => {
              navigate('/dashboard');
            }, 500);
          } catch (storageError: any) {
            throw new Error(`LocalStorage error: ${storageError.message}`);
          }
        } else if (response.redirected && response.location) {
          addLog(`Received redirect to: ${response.location}`);
          window.location.href = response.location;
        } else {
          // Try to extract any useful error information from the response
          const errorMessage = response.error || response.message || 'Invalid response format';
          addLog(`Error in response: ${errorMessage}`);
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('Google callback error:', error);
        setError(error.message || 'Authentication failed');
        addLog(`Error during authentication: ${error.message}`);
        
        // Don't navigate away immediately so user can see the error
        setTimeout(() => {
          navigate('/auth?mode=signin&error=google_login_failed');
        }, 5000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        {!error && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Processing login...</p>
          </>
        )}
        {error && (
          <>
            <div className="text-red-500 text-xl mb-4">Authentication Failed</div>
            <p className="mb-4">Redirecting to login page in a few seconds...</p>
            <button 
              onClick={() => navigate('/auth?mode=signin')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Return to Login
            </button>
          </>
        )}
        <DebugInfo error={error} logs={logs} />
      </div>
    </div>
  );
};

export default GoogleCallback; 