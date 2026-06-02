import React, { useState } from 'react';
import { CommentBase, CreateCommentDTO, UpdateCommentDTO } from '../types/comment';
import { formatUserRole } from '../utils/roleLabels';

interface CommentThreadProps {
  comments: CommentBase[];
  isLoading?: boolean;
  canReply?: boolean;
  canEdit?: (authorId: number) => boolean;
  canDelete?: (authorId: number) => boolean;
  onAdd?: (data: CreateCommentDTO) => Promise<void>;
  onEdit?: (commentId: number, data: UpdateCommentDTO) => Promise<void>;
  onDelete?: (commentId: number) => Promise<void>;
  currentUserId?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

interface CommentItemProps {
  comment: CommentBase;
  isLoading: boolean;
  canReply: boolean;
  canEdit: (authorId: number) => boolean;
  canDelete: (authorId: number) => boolean;
  onAdd: (data: CreateCommentDTO) => Promise<void>;
  onEdit: (commentId: number, data: UpdateCommentDTO) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  currentUserId?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isLoading,
  canReply,
  canEdit,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
  currentUserId,
}) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd({ text: replyText, parentId: comment.id });
      setReplyText('');
      setReplyOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) return;
    setIsSubmitting(true);
    try {
      await onEdit(comment.id, { text: editText });
      setEditOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canUserEdit = currentUserId != null && canEdit(comment.author.id);
  const canUserDelete = currentUserId != null && canDelete(comment.author.id);

  return (
    <div className="comment-item">
      {comment.parent && (
        <div className="comment-reply-preview">
          <span className="comment-reply-preview-author">{comment.parent.author.fullName}</span>
          <span className="comment-reply-preview-text">{comment.parent.text}</span>
        </div>
      )}

      <div className="comment-header">
        <div className="comment-author">{comment.author.fullName}</div>
        <div className="comment-role">{formatUserRole(comment.author.role)}</div>
        <div className="comment-date">
          {new Date(comment.createdAt).toLocaleString('ru-RU')}
        </div>
      </div>

      {!editOpen ? (
        <div className="comment-text">{comment.text}</div>
      ) : (
        <div className="comment-edit">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            disabled={isSubmitting || isLoading}
            rows={3}
          />
          <div className="comment-edit-buttons">
            <button type="button" onClick={handleEditSubmit} disabled={isSubmitting || isLoading}>
              Сохранить
            </button>
            <button type="button" onClick={() => setEditOpen(false)} disabled={isSubmitting || isLoading}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="comment-actions">
        {canReply && (
          <button
            type="button"
            className="comment-action-btn"
            onClick={() => setReplyOpen(!replyOpen)}
            disabled={isLoading}
          >
            Ответить
          </button>
        )}
        {canUserEdit && (
          <button
            type="button"
            className="comment-action-btn"
            onClick={() => setEditOpen(!editOpen)}
            disabled={isLoading}
          >
            Редактировать
          </button>
        )}
        {canUserDelete && (
          <button
            type="button"
            className="comment-action-btn danger"
            onClick={() => onDelete(comment.id)}
            disabled={isLoading}
          >
            Удалить
          </button>
        )}
      </div>

      {replyOpen && (
        <div className="comment-reply">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Напишите ответ..."
            disabled={isSubmitting || isLoading}
            rows={2}
          />
          <div className="comment-reply-buttons">
            <button type="button" onClick={handleReplySubmit} disabled={isSubmitting || isLoading}>
              Отправить
            </button>
            <button type="button" onClick={() => setReplyOpen(false)} disabled={isSubmitting || isLoading}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  isLoading = false,
  canReply = false,
  canEdit = () => false,
  canDelete = () => false,
  onAdd = async () => {},
  onEdit = async () => {},
  onDelete = async () => {},
  currentUserId,
  hasMore = false,
  onLoadMore,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewComment = async () => {
    if (!newCommentText.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd({ text: newCommentText });
      setNewCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comment-thread">
      {canReply && (
        <div className="comment-compose">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Написать комментарий..."
            disabled={isLoading || isSubmitting}
            rows={2}
          />
          <button
            type="button"
            className="button button-primary button-small"
            onClick={handleNewComment}
            disabled={isLoading || isSubmitting || !newCommentText.trim()}
          >
            Отправить
          </button>
        </div>
      )}

      {comments.length === 0 && !isLoading ? (
        <div className="no-comments">Нет комментариев</div>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isLoading={isLoading}
            canReply={canReply}
            canEdit={canEdit}
            canDelete={canDelete}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            currentUserId={currentUserId}
          />
        ))
      )}

      {hasMore && onLoadMore && (
        <button type="button" className="button button-secondary button-block" onClick={onLoadMore} disabled={isLoading}>
          Загрузить ещё
        </button>
      )}
    </div>
  );
};
