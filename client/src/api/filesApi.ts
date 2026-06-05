import axios, { type AxiosResponse } from 'axios';
import httpClient from './httpClient';

function parseFilenameFromDisposition(header: string | undefined): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch) return quotedMatch[1];
  const plainMatch = header.match(/filename=([^;]+)/i);
  if (plainMatch) return plainMatch[1].trim();
  return null;
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function parseBlobError(blob: Blob): Promise<string | null> {
  if (!blob.type.includes('json')) return null;
  try {
    const text = await blob.text();
    const data = JSON.parse(text) as { message?: string; error?: string };
    return data.message ?? data.error ?? null;
  } catch {
    return null;
  }
}

async function downloadFile(
  url: string,
  fallbackName: string
): Promise<void> {
  try {
    const response: AxiosResponse<Blob> = await httpClient.get(url, {
      responseType: 'blob',
    });

    const blob = response.data;
    const apiMessage = await parseBlobError(blob);
    if (apiMessage) {
      throw new Error(apiMessage);
    }

    const disposition = response.headers['content-disposition'] as string | undefined;
    const filename =
      parseFilenameFromDisposition(disposition) ?? fallbackName;
    triggerBrowserDownload(blob, filename);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      const message = await parseBlobError(err.response.data);
      throw new Error(message ?? 'Не удалось скачать файл');
    }
    throw err;
  }
}

export async function downloadWorkFile(
  fileId: number,
  fallbackName: string
): Promise<void> {
  await downloadFile(`/files/works/${fileId}`, fallbackName);
}

export async function downloadSolutionFile(
  fileId: number,
  fallbackName: string
): Promise<void> {
  await downloadFile(`/files/solutions/${fileId}`, fallbackName);
}
