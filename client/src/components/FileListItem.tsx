import React, { useState } from 'react';
import { downloadSolutionFile, downloadWorkFile } from '../api/filesApi';
import { getApiErrorMessage, logApiError } from '../utils/apiError';
import { formatFileSize } from '../utils/formatFileSize';

export interface FileListItemFile {
  id: number;
  originalName: string;
  size?: number;
}

interface FileListItemProps {
  file: FileListItemFile;
  kind: 'work' | 'solution';
  markedForDelete?: boolean;
  onToggleDelete?: (id: number) => void;
  downloadDisabled?: boolean;
}

export const FileListItem: React.FC<FileListItemProps> = ({
  file,
  kind,
  markedForDelete = false,
  onToggleDelete,
  downloadDisabled = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadDisabled || isDownloading) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      if (kind === 'work') {
        await downloadWorkFile(file.id, file.originalName);
      } else {
        await downloadSolutionFile(file.id, file.originalName);
      }
    } catch (err) {
      logApiError('download file', err);
      setDownloadError(getApiErrorMessage(err, 'Не удалось скачать файл'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <li
      className={`file-item ${markedForDelete ? 'file-item-marked-delete' : ''}`}
      title={downloadError ?? undefined}
    >
      <div className="file-item-info">
        <span className="file-item-name" title={file.originalName}>
          {file.originalName}
        </span>
        {file.size != null && (
          <span className="file-item-size">{formatFileSize(file.size)}</span>
        )}
      </div>
      <div className="file-item-actions">
        {onToggleDelete && (
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDelete(file.id);
            }}
            disabled={downloadDisabled}
          >
            {markedForDelete ? 'Отменить' : 'Открепить'}
          </button>
        )}
        <button
          type="button"
          className="button button-secondary button-small file-download-btn schedule-icon-button"
          onClick={handleDownload}
          disabled={downloadDisabled || isDownloading}
          aria-label="Скачать"
          title={downloadError ?? 'Скачать'}
        >
          ↓
        </button>
      </div>
    </li>
  );
};

interface FileListProps {
  files: FileListItemFile[];
  kind: 'work' | 'solution';
  markedForDelete?: number[];
  onToggleDelete?: (id: number) => void;
  downloadDisabled?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  kind,
  markedForDelete = [],
  onToggleDelete,
  downloadDisabled,
}) => (
  <ul className="file-list">
    {files.map((file) => (
      <FileListItem
        key={file.id}
        file={file}
        kind={kind}
        markedForDelete={markedForDelete.includes(file.id)}
        onToggleDelete={onToggleDelete}
        downloadDisabled={downloadDisabled}
      />
    ))}
  </ul>
);
