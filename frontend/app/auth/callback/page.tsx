'use client';

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { googleCallback } from '../../api/api';

// Define log entry type
interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'error';
}

// Debug component to show logs in UI for easier troubleshooting
const DebugConsole = ({ logs }: { logs: LogEntry[] }) => {
  if (!logs || logs.length === 0) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-green-400 p-4 max-h-[30vh] overflow-auto text-xs font-mono">
      <div className="flex justify-between mb-2">
        <h3 className="text-white">Debug Console</h3>
        <button className="text-white" onClick={() => console.clear()}>Clear</button>
      </div>
      <div>
        {logs.map((log, i) => (
          <div key={i} className={`${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
            {log.time}: {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [_, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Custom logger function that both logs to console and stores for UI
  const log = (message: string, type: 'info' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${message}`);
    setLogs(prev => [...prev, { time, message, type }]);
  };
  
  const logError = (message: string) => {
    const time = new Date().toLocaleTimeString();
    console.error(`[${time}] ${message}`);
    setLogs(prev => [...prev, { time, message, type: 'error' }]);
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        log('Auth callback initiated');
        log(`URL params: ${JSON.stringify(Object.fromEntries(searchParams.entries()))}`);
        
        // First check if we have tokens directly in URL (server-side flow)
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        //const isNewUser = searchParams.get('isNewUser');
        
        if (token && refresh) {
          log('Token found in URL, storing and redirecting');
          
          try {
            // Store tokens in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('refresh', refresh);
            
            // Verify storage worked
            const storedToken = localStorage.getItem('token');
            const storedRefresh = localStorage.getItem('refresh');
            log(`Token storage verification - token: ${storedToken ? 'Success' : 'Failed'}, refresh: ${storedRefresh ? 'Success' : 'Failed'}`);
            
            if (!storedToken || !storedRefresh) {
              logError('Failed to store tokens in localStorage');
              throw new Error('Token storage failed');
            }
            
            log('Authentication successful via redirect');
            setLoading(false);
            navigate('/dashboard');
            return;
          } catch (storageError) {
            logError(`LocalStorage error: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
            // Continue to code-based authentication as fallback
          }
        }
        
        // If no tokens, check for authorization code (client-side flow)
        const code = searchParams.get('code');
        log(`Authorization code present: ${!!code}`);
        
        if (!code) {
          logError('No code or tokens received in callback');
          setError('No authorization code received');
          setLoading(false);
          navigate('/?mode=signin&error=google_login_failed');
          return;
        }

        log(`Exchanging code for token: ${code.substring(0, 10)}...`);
        try {
          const userData = await googleCallback(code);
          log(`Received user data response: ${JSON.stringify(userData)}`);
          
          if (userData && userData.token) {
            // Store tokens from API response
            log('Storing tokens from response');
            try {
              localStorage.setItem('token', userData.token);
              if (userData.refresh) {
                localStorage.setItem('refresh', userData.refresh);
              }
              
              // Verify storage worked
              const storedToken = localStorage.getItem('token');
              const storedRefresh = localStorage.getItem('refresh');
              log(`Token storage verification - token: ${storedToken ? 'Success' : 'Failed'}, refresh: ${storedRefresh ? 'Success' : 'Failed'}`);
              
              log('Authentication successful via code exchange');
              setLoading(false);
              navigate('/dashboard');
            } catch (storageError) {
              logError(`LocalStorage error during token storage: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
              setError('Failed to store authentication tokens');
              setLoading(false);
              navigate('/?mode=signin&error=storage_failed');
            }
          } else if (userData && userData.redirected) {
            log('Redirect handled by googleCallback function');
            setLoading(false);
            // The redirect will happen automatically, no need to navigate
          } else {
            logError(`Authentication failed: Invalid response format: ${JSON.stringify(userData)}`);
            setError('Invalid response format from server');
            setLoading(false);
            navigate('/?mode=signin&error=google_login_failed');
          }
        } catch (callbackError) {
          logError(`Error in googleCallback: ${callbackError instanceof Error ? callbackError.message : 'Unknown error'}`);
          throw callbackError;
        }
      } catch (error) {
        logError(`Error during authentication: ${error instanceof Error ? error.message: 'Unknown error'}`);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
        navigate('/?mode=signin&error=google_login_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Return to Login
        </button>
        <DebugConsole logs={logs} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="mt-4">Processing authentication...</div>
      <DebugConsole logs={logs} />
    </div>
  );
} 