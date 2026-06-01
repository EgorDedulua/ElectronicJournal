export interface SolutionFile {
  id: number;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export interface SolutionStudent {
  id: number;
  fullName: string;
}

export interface SolutionData {
  id: number;
  workId: number;
  studentId: number;
  student: SolutionStudent;
  files: SolutionFile[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSolutionDTO {
  workId: number;
}

export interface UpdateSolutionDTO {
  deleteFileIds?: number[];
}

export interface SolutionWithStudentInfo extends SolutionData {
  studentName: string;
}
