export interface WorkFile {
  id: number;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export interface WorkSolutionSummary {
  id: number;
  studentName: string;
  createdAt: string;
  updatedAt?: string | null;
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
  solutionId?: number | null;
  solutions?: WorkSolutionSummary[];
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
