'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ExtensionCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      return;
    }

    console.log('[ExtensionCallback] Token found:', token.substring(0, 20) + '...');

    // Try to send message to extension via window.postMessage
    // Extension content script will listen for this
    console.log('[ExtensionCallback] Sending token via postMessage...');
    console.log('[ExtensionCallback] window.location.origin:', window.location.origin);

    const message = {
      type: 'SONIOX_EXTENSION_AUTH',
      token: token,
    };
    console.log('[ExtensionCallback] Message to send:', message);

    window.postMessage(message, window.location.origin);
    console.log('[ExtensionCallback] postMessage sent');

    setStatus('success');

    // Auto-close after 2 seconds (give time for message to be received)
    setTimeout(() => {
      console.log('[ExtensionCallback] Auto-closing window...');
      window.close();
    }, 2000);
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      {status === 'processing' && (
        <>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Authenticating...</h1>
          <p style={{ color: '#666' }}>Please wait</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#4CAF50',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#4CAF50' }}>
            Extension Authenticated!
          </h1>
          <p style={{ color: '#666' }}>You can close this tab now.</p>
          <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>
            This window will close automatically...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#f44336',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#f44336' }}>
            Authentication Failed
          </h1>
          <p style={{ color: '#666' }}>No authentication token found.</p>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function ExtensionCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #1976d2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    }>
      <ExtensionCallbackContent />
    </Suspense>
  );
}
