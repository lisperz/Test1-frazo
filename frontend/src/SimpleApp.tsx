import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SimpleVideoInpaintingPage from './pages/video/SimpleVideoInpaintingPage';

const SimpleApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SimpleVideoInpaintingPage />} />
      <Route path="*" element={<SimpleVideoInpaintingPage />} />
    </Routes>
  );
};

export default SimpleApp;