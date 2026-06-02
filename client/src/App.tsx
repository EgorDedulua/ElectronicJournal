import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import { WorkPage } from './pages/WorkPage';
import { SolutionReviewPage } from './pages/SolutionReviewPage';
import { StudentSolutionPage } from './pages/StudentSolutionPage';

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[ 'admin' ]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={[ 'teacher' ]}>
              <TeacherPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={[ 'student' ]}>
              <StudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/work/new/:groupId/:subjectId/:lessonId"
          element={
            <ProtectedRoute allowedRoles={[ 'teacher' ]}>
              <WorkPage isTeacher={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/work/:workId/:groupId/:subjectId/:lessonId"
          element={
            <ProtectedRoute allowedRoles={[ 'teacher' ]}>
              <WorkPage isTeacher={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/solution/:solutionId/:groupId/:subjectId/:lessonId/:workId"
          element={
            <ProtectedRoute allowedRoles={[ 'teacher' ]}>
              <SolutionReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/work/:workId/:groupId/:subjectId/:lessonId"
          element={
            <ProtectedRoute allowedRoles={[ 'student' ]}>
              <WorkPage isTeacher={false} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/solution/:solutionId/:workId/:groupId/:subjectId/:lessonId"
          element={
            <ProtectedRoute allowedRoles={[ 'student' ]}>
              <StudentSolutionPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
