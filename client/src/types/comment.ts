export interface CommentAuthor {
  id: number;
  fullName: string;
  role: 'teacher' | 'student' | 'admin';
}

export interface CommentBase {
  id: number;
  text: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt?: string;
  parentId?: number;
}

export interface WorkComment extends CommentBase {
  workId: number;
}

export interface SolutionComment extends CommentBase {
  solutionId: number;
}

export interface CommentWithReplies extends CommentBase {
  parent?: CommentBase;
  replies?: CommentWithReplies[];
}

export interface CreateCommentDTO {
  text: string;
  parentId?: number;
}

export interface UpdateCommentDTO {
  text: string;
}

export interface CommentsResponse {
  data: CommentBase[];
  hasMore: boolean;
  nextOffset: number;
}
