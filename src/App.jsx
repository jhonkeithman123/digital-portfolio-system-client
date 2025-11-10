import { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MessageContainer from "./components/MessageContainer.jsx";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import RoleSelect from "./pages/RoleSelect/RoleSelect";
import Signup from "./pages/Signup/Signup";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import NotFound from "./pages/NotFound/NotFound.jsx";
import JoinClassroom from "./pages/classrooms/JoinClassroom.jsx";
import CreateClassroom from "./pages/classrooms/CreateClassroom.jsx";
import QuizCreate from "./pages/Home/section-pages/QuizCreate.jsx";
import QuizEditPage from "./pages/Home/section-pages/quiz-edit.jsx";
import QuizTakePage from "./pages/Home/section-pages/quiz-take.jsx";


const ProtectedRoute = ({ children, showMessage }) => {
  const [authorized, setAuthorized] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if(!token) {
      showMessage("Unauthorize access", "error");
      setAuthorized(false);
    } else {
      setAuthorized(true);
    }

   window.addEventListener("securitypolicyviolation", (e) => {
      fetch('/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directive: e.violatedDirective,
          blockedURI: e.blockedURI,
          originalPolicy: e.originalPolicy,
        }),
      });
    });

  }, [showMessage])

  if (authorized === null) return null;
  return authorized ? children : <Navigate to="/login" replace />
}

function App() {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [messageKey, setMessageKey] = useState(0);
  
  const showMessage = useCallback((msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setMessageKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const cachedRole = localStorage.getItem('role');

    if (cachedRole === 'teacher') {
      root.style.setProperty('--accent-color', '#dc3545');
    } else if (cachedRole === 'student') {
      root.style.setProperty('--accent-color', '#007bff');
    }
  }, []);

  return (
    <Router>
      <main style={{ height: '94vh' }}>
        <MessageContainer
          key={messageKey}
          type={messageType}
          message={message}
          onClose={() => setMessage('')}
          duration={2000}
        />
        <Routes> 
          <Route path="/" element={<RoleSelect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/home" element={<ProtectedRoute showMessage={showMessage}><Home /></ProtectedRoute>} />
          <Route path="/dash" element={<ProtectedRoute showMessage={showMessage}><Dashboard /></ProtectedRoute>} />
          <Route path="/join" element={<ProtectedRoute showMessage={showMessage}><JoinClassroom /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute showMessage={showMessage}><CreateClassroom /></ProtectedRoute>} />
          <Route path="/quizes/:code/create" element={<ProtectedRoute showMessage={showMessage}><QuizCreate /></ProtectedRoute>} />
          <Route path="/quizes/:classCode/quizzes/:quizId/edit" element={<ProtectedRoute showMessage={showMessage}><QuizEditPage /></ProtectedRoute>} />
          <Route path="/quizes/:classCode/quizzes/:quizId" element={<QuizTakePage />} />
          <Route path="*" element={<NotFound />} /> 
        </Routes>

      </main>
    </Router>
  );
};

export default App;
