import React, { useState, useCallback } from 'react';

interface File {
  id: number;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

interface FileUploadAreaProps {
  files: File[];
  onFilesSelected?: (newFiles: FileList) => void;
  onFileDeleted?: (fileId: number) => void;
  isLoading?: boolean;
  maxFiles?: number;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  files,
  onFilesSelected,
  onFileDeleted,
  isLoading = false,
  maxFiles = 10,
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (onFilesSelected && e.dataTransfer.files) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFilesSelected && e.target.files) {
      onFilesSelected(e.target.files);
    }
  }, [onFilesSelected]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const canAddMoreFiles = files.length < maxFiles;

  return (
    <div className="file-upload-area">
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {canAddMoreFiles ? (
          <>
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              Перетащите файлы сюда или <label className="upload-link">выберите файлы</label>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                style={{ display: 'none' }}
                disabled={isLoading}
              />
            </div>
            <div className="upload-hint">
              Максимум {maxFiles} файлов, {files.length} загружено
            </div>
          </>
        ) : (
          <div className="upload-full">
            Достигнут максимум файлов ({maxFiles})
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h4>Загруженные файлы ({files.length})</h4>
          {files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-info">
                <div className="file-name">{file.originalName}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
              <button
                className="file-delete-btn"
                onClick={() => onFileDeleted?.(file.id)}
                disabled={isLoading}
                title="Удалить файл"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
