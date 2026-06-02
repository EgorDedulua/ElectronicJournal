import React, { useState, useCallback, useId, useRef } from 'react';

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
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      if (onFilesSelected && e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onFilesSelected && e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
      }
      e.target.value = '';
    },
    [onFilesSelected]
  );

  const openFilePicker = () => {
    if (!isLoading && canAddMoreFiles) {
      inputRef.current?.click();
    }
  };

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
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        className="upload-input-hidden"
        onChange={handleFileInput}
        disabled={isLoading || !canAddMoreFiles}
      />
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${canAddMoreFiles ? 'upload-zone-clickable' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        role={canAddMoreFiles ? 'button' : undefined}
        tabIndex={canAddMoreFiles ? 0 : undefined}
      >
        {canAddMoreFiles ? (
          <>
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              Перетащите файлы сюда или{' '}
              <span
                className="upload-link"
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePicker();
                }}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                выберите файлы
              </span>
            </div>
            <div className="upload-hint">
              Доступные расширения: .pdf, .png, .jpg, .jpeg, .zip, .doc, .docx, .xls, .xlsx. Максимум {maxFiles} файлов, загружено: {files.length}
            </div>
          </>
        ) : (
          <div className="upload-full">Достигнут максимум файлов ({maxFiles})</div>
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
                type="button"
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
