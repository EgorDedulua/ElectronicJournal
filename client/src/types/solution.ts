export interface SolutionFile {
  id: number;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export interface SolutionData {
  id: number;
  workId: number;
  studentId: number;
  studentName: string;
  lessonType?: string;
  lesson?: {
    type?: string;
  };
  files: SolutionFile[];
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateSolutionDTO {
  deleteFileIds?: number[];
}
