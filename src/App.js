import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './auth/SignIn';
import SignUp from './auth/SignUp';
import GithubCallback from './auth/GithubCallback';
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword';
import SignUpAdmin from './auth/SignUpAdmin';
 
export default function App() {
  return (
    <Router>
      <div className="dark-theme-app">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/github/callback" element={<GithubCallback />} />
          <Route path="/admin/register" element={<SignUpAdmin/>}/>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}