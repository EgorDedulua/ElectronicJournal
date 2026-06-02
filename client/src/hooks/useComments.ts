import { useCallback, useState } from 'react';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  type CommentScopeParams,
} from '../api/worksApi';
import type { CommentBase, CreateCommentDTO, UpdateCommentDTO } from '../types/comment';
import { getApiErrorMessage, logApiError } from '../utils/apiError';

export function useComments(scopeParams: CommentScopeParams | null) {
  const [comments, setComments] = useState<CommentBase[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!scopeParams) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getComments(scopeParams, 0, 20);
      setComments(res.data);
      setHasMore(res.hasMore);
      setNextOffset(res.nextOffset);
    } catch (err: unknown) {
      logApiError('loadComments', err);
      setError(getApiErrorMessage(err, 'Не удалось загрузить комментарии'));
    } finally {
      setIsLoading(false);
    }
  }, [scopeParams]);

  const loadMore = useCallback(async () => {
    if (!scopeParams || !hasMore) return;
    setIsLoading(true);
    try {
      const res = await getComments(scopeParams, nextOffset, 20);
      setComments((prev) => [...prev, ...res.data]);
      setHasMore(res.hasMore);
      setNextOffset(res.nextOffset);
    } catch (err: unknown) {
      logApiError('loadMoreComments', err);
      setError(getApiErrorMessage(err, 'Не удалось загрузить комментарии'));
    } finally {
      setIsLoading(false);
    }
  }, [scopeParams, hasMore, nextOffset]);

  const add = useCallback(
    async (dto: CreateCommentDTO) => {
      if (!scopeParams) return;
      const created = await createComment(scopeParams, dto);
      setComments((prev) => [...prev, created]);
    },
    [scopeParams]
  );

  const edit = useCallback(
    async (commentId: number, dto: UpdateCommentDTO) => {
      if (!scopeParams) return;
      const updated = await updateComment(scopeParams, commentId, dto);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    },
    [scopeParams]
  );

  const remove = useCallback(
    async (commentId: number) => {
      if (!scopeParams) return;
      await deleteComment(scopeParams, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    },
    [scopeParams]
  );

  return {
    comments,
    hasMore,
    isLoading,
    error,
    load,
    loadMore,
    add,
    edit,
    remove,
    setComments,
  };
}
