export interface FileWithDisplayName {
  file: File;
  displayName: string;
}

export interface UploadState {
  selectedFiles: File[];
  displayNames: Record<string, string>;
  uploadError: string;
  showSuccess: boolean;
  uploadingCount: number;
  uploadedCount: number;
}

export interface UploadActions {
  setSelectedFiles: (files: File[]) => void;
  setDisplayNames: (names: Record<string, string>) => void;
  setUploadError: (error: string) => void;
  setShowSuccess: (show: boolean) => void;
  setUploadingCount: (count: number) => void;
  setUploadedCount: (count: number) => void;
}
