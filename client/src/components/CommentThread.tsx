import React, { useState } from 'react';
import { CommentWithReplies, CreateCommentDTO, UpdateCommentDTO } from '../types';

interface CommentThreadProps {
  comments: CommentWithReplies[];
  isLoading?: boolean;
  canReply?: boolean;
  canEdit?: (authorId: number) => boolean;
  canDelete?: (authorId: number) => boolean;
  onAdd?: (data: CreateCommentDTO) => Promise<void>;
  onEdit?: (commentId: number, data: UpdateCommentDTO) => Promise<void>;
  onDelete?: (commentId: number) => Promise<void>;
  currentUserId?: number;
  maxDepth?: number;
}

interface CommentItemProps {
  comment: CommentWithReplies;
  depth: number;
  maxDepth: number;
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
  depth,
  maxDepth,
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

  const canUserEdit = currentUserId && canEdit(comment.author.id);
  const canUserDelete = currentUserId && canDelete(comment.author.id);
  const canUserReply = canReply && depth < maxDepth;

  return (
    <div className={`comment-item comment-depth-${depth}`}>
      {comment.parent && (
        <div className="comment-parent-bar">
          Ответ на: <strong>{comment.parent.author.fullName}</strong> — {comment.parent.text.substring(0, 50)}...
        </div>
      )}

      <div className="comment-header">
        <div className="comment-author">{comment.author.fullName}</div>
        <div className="comment-role">{comment.author.role}</div>
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
            <button onClick={handleEditSubmit} disabled={isSubmitting || isLoading}>
              Сохранить
            </button>
            <button onClick={() => setEditOpen(false)} disabled={isSubmitting || isLoading}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="comment-actions">
        {canUserReply && (
          <button
            className="comment-action-btn"
            onClick={() => setReplyOpen(!replyOpen)}
            disabled={isLoading}
          >
            Ответить
          </button>
        )}
        {canUserEdit && (
          <button
            className="comment-action-btn"
            onClick={() => setEditOpen(!editOpen)}
            disabled={isLoading}
          >
            Редактировать
          </button>
        )}
        {canUserDelete && (
          <button
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
            <button onClick={handleReplySubmit} disabled={isSubmitting || isLoading}>
              Отправить
            </button>
            <button onClick={() => setReplyOpen(false)} disabled={isSubmitting || isLoading}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              isLoading={isLoading}
              canReply={canReply}
              canEdit={canEdit}
              canDelete={canDelete}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              currentUserId={currentUserId}
            />
          ))}
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
  maxDepth = 3,
}) => {
  return (
    <div className="comment-thread">
      {comments.length === 0 ? (
        <div className="no-comments">Нет комментариев</div>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            depth={0}
            maxDepth={maxDepth}
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
    </div>
  );
};
