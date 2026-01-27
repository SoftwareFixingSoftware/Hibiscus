import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './auth/SignIn';
import SignUp from './auth/SignUp';

export default function App() {
  return (
    <Router>
      <div className="font-sans antialiased">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}