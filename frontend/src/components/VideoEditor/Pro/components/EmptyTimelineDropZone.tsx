/**
 * Empty Timeline Drop Zone Component
 *
 * Displays when no segments exist. Allows users to drag-and-drop
 * or click to upload audio files to create segments.
 */

import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface EmptyTimelineDropZoneProps {
  isDragging: boolean;
  isOver: boolean;
  error: string | null;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
  onClearError: () => void;
}

export const EmptyTimelineDropZone: React.FC<EmptyTimelineDropZoneProps> = ({
  isDragging,
  isOver,
  error,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onClearError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    onClearError();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const getBorderColor = () => {
    if (error) return '#ff4d4f';
    if (isOver) return '#1890ff';
    return '#d9d9d9';
  };

  const getBackgroundColor = () => {
    if (error) return '#fff2f0';
    if (isOver) return '#e6f7ff';
    return '#fafafa';
  };

  return (
    <Box
      onClick={handleClick}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      sx={{
        width: '100%',
        height: '40px',
        border: `2px dashed ${getBorderColor()}`,
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        cursor: 'pointer',
        backgroundColor: getBackgroundColor(),
        transition: 'all 0.3s ease',
        userSelect: 'none',
        '&:hover': {
          borderColor: error ? '#ff4d4f' : '#1890ff',
          backgroundColor: error ? '#fff2f0' : '#f0f8ff',
          '& .upload-icon': {
            transform: 'scale(1.1)',
          },
        },
      }}
    >
      {/* Upload Icon */}
      <CloudUpload
        className="upload-icon"
        sx={{
          fontSize: 24,
          color: error ? '#ff4d4f' : isOver ? '#1890ff' : '#999',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Text Container */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Main Text */}
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: 500,
            color: error ? '#ff4d4f' : '#333',
          }}
        >
          {error || (isOver ? 'Drop audio file here' : 'Drop audio files here to create segments')}
        </Typography>

        {/* Subtitle */}
        {!error && (
          <Typography
            sx={{
              fontSize: '11px',
              color: '#999',
            }}
          >
            or click to browse
          </Typography>
        )}
      </Box>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </Box>
  );
};
