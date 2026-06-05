import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherCanEditSubject } from '../api/teacherApi';
import { logApiError } from '../utils/apiError';

interface UseTeacherSubjectAccessOptions {
  groupId: number;
  subjectId: number;
  enabled?: boolean;
  redirectOnDeny?: boolean;
}

export function useTeacherSubjectAccess({
  groupId,
  subjectId,
  enabled = true,
  redirectOnDeny = true,
}: UseTeacherSubjectAccessOptions) {
  const navigate = useNavigate();
  const [canEdit, setCanEdit] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !groupId || !subjectId) {
      setCanEdit(null);
      setIsChecking(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      setIsChecking(true);
      setError(null);
      try {
        const allowed = await teacherCanEditSubject(groupId, subjectId);
        if (cancelled) return;
        setCanEdit(allowed);
        if (!allowed && redirectOnDeny) {
          navigate('/teacher', { replace: true });
        }
      } catch (err) {
        logApiError('teacherSubjectAccess', err);
        if (cancelled) return;
        setError('Не удалось проверить доступ к предмету');
        setCanEdit(false);
        if (redirectOnDeny) {
          navigate('/teacher', { replace: true });
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [enabled, groupId, subjectId, redirectOnDeny, navigate]);

  return { canEdit, isChecking, error };
}
