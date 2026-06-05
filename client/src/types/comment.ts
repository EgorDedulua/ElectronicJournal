export interface CommentAuthor {
  id: number;
  fullName: string;
  role: 'teacher' | 'student' | 'admin';
}

export interface CommentParentPreview {
  id: number;
  text: string;
  author: CommentAuthor;
}

export interface CommentBase {
  id: number;
  text: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt?: string;
  parent?: CommentParentPreview | null;
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

/** @deprecated use CommentBase */
export interface CommentWithReplies extends CommentBase {
  parentId?: number;
  replies?: CommentWithReplies[];
}
