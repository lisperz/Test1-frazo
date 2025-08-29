import React, { useState, useEffect } from 'react';

const DebugDashboard: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugInfo(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    addDebugLog('DebugDashboard: Component mounting');
    
    // Check localStorage
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    addDebugLog(`localStorage check: token=${!!token}, user=${!!user}`);
    
    // Check window object
    addDebugLog(`Window location: ${window.location.href}`);
    addDebugLog(`Browser: ${navigator.userAgent}`);
    
    // Check React version
    addDebugLog(`React version: ${React.version}`);
    
    // Test timer to see if component stays mounted
    const timer = setInterval(() => {
      addDebugLog('Component still mounted (10s heartbeat)');
    }, 10000);
    
    return () => {
      addDebugLog('DebugDashboard: Component unmounting');
      clearInterval(timer);
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#333' }}>Debug Dashboard</h1>
      <p style={{ color: '#666' }}>This is a debug version to identify rendering issues.</p>
      
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        border: '1px solid #ccc'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Debug Logs:</h2>
        <div style={{
          maxHeight: '300px',
          overflow: 'auto',
          backgroundColor: '#fff',
          padding: '10px',
          borderRadius: '3px',
          fontSize: '12px',
          lineHeight: '1.5'
        }}>
          {debugInfo.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '18px' }}>Test Actions:</h2>
        <button
          onClick={() => {
            addDebugLog('Test button clicked');
            alert('Button works! Check console for logs.');
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Alert
        </button>
        
        <button
          onClick={() => {
            addDebugLog('Testing setState...');
            setDebugInfo(prev => [...prev, 'Manual log entry added']);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test State Update
        </button>
        
        <button
          onClick={() => {
            addDebugLog('Forcing error for error boundary test');
            throw new Error('Test error thrown intentionally');
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Error Boundary
        </button>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e8f5e9',
        borderRadius: '5px'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>System Info:</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Page loaded at: {new Date().toLocaleString()}</li>
          <li>Current URL: {window.location.href}</li>
          <li>User Agent: {navigator.userAgent.substring(0, 50)}...</li>
          <li>Screen: {window.screen.width}x{window.screen.height}</li>
          <li>localStorage items: {Object.keys(localStorage).length}</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugDashboard;