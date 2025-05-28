import { useEffect, useState } from 'react';
import axios from 'axios';

const APIConnectionTest = () => {
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [googleStatus, setGoogleStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [openaiStatus, setOpenaiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>(new Date().toLocaleTimeString());

  const checkConnections = async () => {
    // Reset states
    setBackendStatus('loading');
    setGoogleStatus('loading');
    setOpenaiStatus('loading');
    setErrorDetails(null);
    
    try {
      // Check backend connection
      await axios.get('http://localhost:8000/api/health-check/');
      setBackendStatus('connected');
      
      // Check Google connection
      try {
        await axios.get('http://localhost:8000/api/user/google/status/');
        setGoogleStatus('connected');
      } catch (error) {
        setGoogleStatus('loading'); // Just mark as loading since it requires auth
      }
      
      // Check OpenAI connection
      try {
        await axios.get('http://localhost:8000/api/openai/status/');
        setOpenaiStatus('connected');
      } catch (error) {
        setOpenaiStatus('loading'); // Just mark as loading since it requires auth
      }
    } catch (error) {
      console.error('API Connection error:', error);
      setBackendStatus('error');
      if (axios.isAxiosError(error)) {
        setErrorDetails(`Request failed with status code ${error.response?.status}`);
      } else {
        setErrorDetails('Unknown error occurred');
      }
    }
    
    setLastChecked(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    checkConnections();
  }, []);

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">API Connection Test</h2>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
            backendStatus === 'connected' ? 'bg-green-500' : 
            backendStatus === 'loading' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
          }`}></span>
          <span>Backend Connection: {
            backendStatus === 'connected' ? 'Connected' : 
            backendStatus === 'loading' ? 'Loading' : 'Error'
          }</span>
        </div>

        <div className="flex items-center">
          <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
            googleStatus === 'connected' ? 'bg-green-500' : 
            googleStatus === 'loading' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
          }`}></span>
          <span>Google Fit API: {
            googleStatus === 'connected' ? 'Connected' : 
            googleStatus === 'loading' ? 'Loading' : 'Error'
          }</span>
        </div>

        <div className="flex items-center">
          <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
            openaiStatus === 'connected' ? 'bg-green-500' : 
            openaiStatus === 'loading' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'
          }`}></span>
          <span>OpenAI API: {
            openaiStatus === 'connected' ? 'Connected' : 
            openaiStatus === 'loading' ? 'Loading' : 'Error'
          }</span>
        </div>
      </div>

      {errorDetails && (
        <div className="mt-4 p-3 bg-red-900/50 rounded-md">
          <h3 className="text-sm font-semibold">Error Details:</h3>
          <p className="text-sm text-red-300">{errorDetails}</p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        Last checked: {lastChecked} PM
      </div>
    </div>
  );
};

export default APIConnectionTest; 