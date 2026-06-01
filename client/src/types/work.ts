export interface WorkFile {
  id: number;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export interface WorkData {
  id: number;
  title: string;
  description?: string;
  deadline?: string;
  createdAt: string;
  updatedAt?: string;
  files: WorkFile[];
  lessonId: number;
  courseId: number;
}

export interface CreateWorkDTO {
  title: string;
  description?: string;
  deadline?: string;
}

export interface UpdateWorkDTO {
  title?: string;
  description?: string;
  deadline?: string;
  deleteFileIds?: number[];
}
