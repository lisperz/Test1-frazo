import { useState, useCallback, useRef } from 'react';
import { chunkedUploadApi } from '../services/api';

interface UploadProgress {
  uploadId: string;
  filename: string;
  totalSize: number;
  chunksUploaded: number;
  totalChunks: number;
  progress: number;
  isComplete: boolean;
  error?: string;
}

interface UseChunkedUploadOptions {
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

interface UseChunkedUploadReturn {
  upload: (file: File) => Promise<any>;
  cancel: () => void;
  retry: () => Promise<any>;
  progress: UploadProgress | null;
  isUploading: boolean;
  error: string | null;
}

export const useChunkedUpload = (options: UseChunkedUploadOptions = {}): UseChunkedUploadReturn => {
  const {
    chunkSize = 1024 * 1024, // 1MB default
    maxRetries = 3,
    onProgress,
    onComplete,
    onError,
  } = options;

  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentFileRef = useRef<File | null>(null);
  const uploadSessionRef = useRef<any>(null);

  const calculateMD5 = useCallback(async (data: ArrayBuffer): Promise<string> => {
    const crypto = window.crypto;
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  const uploadChunk = useCallback(async (
    uploadId: string,
    chunkNumber: number,
    chunkData: ArrayBuffer,
    retryCount = 0
  ): Promise<void> => {
    try {
      // Calculate chunk hash for verification
      const chunkHash = await calculateMD5(chunkData);
      
      // Create form data
      const formData = new FormData();
      formData.append('chunk_number', chunkNumber.toString());
      formData.append('chunk_hash', chunkHash);
      formData.append('chunk', new Blob([chunkData]));

      const response = await chunkedUploadApi.uploadChunk(uploadId, formData, {
        signal: abortControllerRef.current?.signal,
      });

      // Update progress
      if (progress) {
        const newProgress = {
          ...progress,
          chunksUploaded: response.chunks_received,
          progress: response.progress,
          isComplete: response.is_complete,
        };
        setProgress(newProgress);
        onProgress?.(newProgress);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; // Don't retry cancelled uploads
      }

      if (retryCount < maxRetries) {
        // Exponential backoff for retries
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadChunk(uploadId, chunkNumber, chunkData, retryCount + 1);
      }
      
      throw new Error(`Failed to upload chunk ${chunkNumber}: ${error.message}`);
    }
  }, [progress, maxRetries, onProgress, calculateMD5]);

  const upload = useCallback(async (file: File): Promise<any> => {
    if (isUploading) {
      throw new Error('Upload already in progress');
    }

    setIsUploading(true);
    setError(null);
    currentFileRef.current = file;
    abortControllerRef.current = new AbortController();

    try {
      // Initialize upload session
      const initResponse = await chunkedUploadApi.initializeUpload({
        filename: file.name,
        total_size: file.size,
        chunk_size: chunkSize,
      });

      uploadSessionRef.current = initResponse;

      const initialProgress: UploadProgress = {
        uploadId: initResponse.upload_id,
        filename: file.name,
        totalSize: file.size,
        chunksUploaded: 0,
        totalChunks: initResponse.total_chunks,
        progress: 0,
        isComplete: false,
      };

      setProgress(initialProgress);
      onProgress?.(initialProgress);

      // Upload chunks in parallel (limited concurrency)
      const maxConcurrency = 3;
      const chunks: Promise<void>[] = [];
      
      for (let chunkNumber = 0; chunkNumber < initResponse.total_chunks; chunkNumber++) {
        const start = chunkNumber * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkData = await file.slice(start, end).arrayBuffer();

        // Add chunk upload to queue
        const chunkPromise = uploadChunk(initResponse.upload_id, chunkNumber, chunkData);
        chunks.push(chunkPromise);

        // Limit concurrency
        if (chunks.length >= maxConcurrency || chunkNumber === initResponse.total_chunks - 1) {
          await Promise.all(chunks);
          chunks.length = 0; // Clear array
        }

        // Check if upload was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Upload cancelled');
        }
      }

      // Calculate final file hash for verification
      const fileBuffer = await file.arrayBuffer();
      const finalHash = await calculateMD5(fileBuffer);

      // Finalize upload
      const finalizeResponse = await chunkedUploadApi.finalizeUpload(initResponse.upload_id, {
        final_hash: finalHash,
      });

      setIsUploading(false);
      onComplete?.(finalizeResponse);
      
      return finalizeResponse;

    } catch (error: any) {
      setIsUploading(false);
      
      if (error.name === 'AbortError' || error.message === 'Upload cancelled') {
        setError('Upload cancelled');
        onError?.('Upload cancelled');
      } else {
        const errorMessage = error.response?.data?.detail || error.message || 'Upload failed';
        setError(errorMessage);
        onError?.(errorMessage);
      }
      
      // Clean up upload session on error
      if (uploadSessionRef.current?.upload_id) {
        try {
          await chunkedUploadApi.cancelUpload(uploadSessionRef.current.upload_id);
        } catch (cleanupError) {
          console.error('Failed to cleanup upload session:', cleanupError);
        }
      }
      
      throw error;
    }
  }, [isUploading, chunkSize, onProgress, onComplete, onError, uploadChunk, calculateMD5]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clean up upload session
    if (uploadSessionRef.current?.upload_id) {
      chunkedUploadApi.cancelUpload(uploadSessionRef.current.upload_id).catch(error => {
        console.error('Failed to cancel upload session:', error);
      });
    }
    
    setIsUploading(false);
    setError('Upload cancelled');
    setProgress(null);
  }, []);

  const retry = useCallback(async (): Promise<any> => {
    if (!currentFileRef.current) {
      throw new Error('No file to retry');
    }
    
    setError(null);
    return upload(currentFileRef.current);
  }, [upload]);

  return {
    upload,
    cancel,
    retry,
    progress,
    isUploading,
    error,
  };
};