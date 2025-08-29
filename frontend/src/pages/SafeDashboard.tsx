import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SafeDashboard: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[SafeDashboard] Component mounted');
    console.log('[SafeDashboard] Current user from localStorage:', localStorage.getItem('user'));
    console.log('[SafeDashboard] Access token exists:', !!localStorage.getItem('access_token'));
    
    return () => {
      console.log('[SafeDashboard] Component unmounting');
    };
  }, []);

  const handleNavigation = (path: string) => {
    console.log(`[SafeDashboard] Navigating to: ${path}`);
    navigate(path);
  };

  const handleLogout = () => {
    console.log('[SafeDashboard] Logging out...');
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Dashboard</h1>
      <p>Welcome to Video Text Inpainting Service!</p>
      
      <div style={{ marginTop: '30px' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleNavigation('/editor')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Open Video Editor
          </button>
          <button 
            onClick={() => handleNavigation('/upload')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f50057',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Upload Video
          </button>
          <button 
            onClick={() => handleNavigation('/jobs')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            View Jobs
          </button>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Getting Started</h3>
        <ol>
          <li>Click "Open Video Editor" to start removing text from videos</li>
          <li>Upload a video file</li>
          <li>Draw rectangles around the text you want to remove</li>
          <li>Submit for processing</li>
        </ol>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h3>Your Account</h3>
        <p><strong>Plan:</strong> Free</p>
        <p><strong>Credits:</strong> 100</p>
        <p><strong>Status:</strong> Active</p>
      </div>
    </div>
  );
};

export default SafeDashboard;