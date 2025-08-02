import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Video Text Inpainting</h1>
      <p>Upload your video to remove text automatically</p>
      <div style={{ 
        border: '2px dashed #ccc', 
        padding: '50px', 
        margin: '20px 0',
        backgroundColor: '#f9f9f9'
      }}>
        <p>Drag & Drop Video Here</p>
        <button style={{
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Choose File
        </button>
      </div>
      <p>Backend API running at: http://127.0.0.1:8000</p>
    </div>
  );
};

export default TestComponent;