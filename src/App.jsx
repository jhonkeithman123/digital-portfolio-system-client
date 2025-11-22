import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { apiFetch } from "./utils/apiClient.js";
import MessageContainer from "./components/Component-elements/MessageContainer";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import RoleSelect from "./pages/RoleSelect/RoleSelect";
import Signup from "./pages/Signup/Signup";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import Dashboard from "./pages/Dashboard/Dashboard";
import NotFound from "./pages/NotFound/NotFound";
import JoinClassroom from "./pages/classrooms/JoinClassroom";
import CreateClassroom from "./pages/classrooms/CreateClassroom";
import QuizCreate from "./components/Quiz-component/QuizCreate";
import QuizEditPage from "./components/Quiz-component/quiz-edit";
import QuizTakePage from "./components/Quiz-component/quiz-take";
import QuizReviewPage from "./components/Quiz-component/quiz-review";

const ProtectedRoute = ({ children, showMessage }) => {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { unauthorized, data } = await apiFetch("/auth/session");
      if (!mounted) return;
      if (unauthorized || !data?.success) {
        showMessage("Unauthorized access", "error");
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [showMessage]);

  if (authorized === null) return null;
  return authorized ? children : <Navigate to="/login" replace />;
};

function App() {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [messageKey, setMessageKey] = useState(0);

  const showMessage = useCallback((msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setMessageKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const cachedRole = localStorage.getItem("role");

    if (cachedRole === "teacher") {
      root.style.setProperty("--accent-color", "#dc3545");
    } else if (cachedRole === "student") {
      root.style.setProperty("--accent-color", "#007bff");
    }
  }, []);

  return (
    <Router>
      <main style={{ height: "94vh" }}>
        <MessageContainer
          key={messageKey}
          type={messageType}
          message={message}
          onClose={() => setMessage("")}
          duration={2000}
        />
        <Routes>
          <Route path="/" element={<RoleSelect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route
            path="/quizzes/:classCode/quizzes/:quizId"
            element={<QuizTakePage />}
          />
          <Route
            path="/quizzes/:classCode/quizzes/:quizId/review"
            element={<QuizReviewPage />}
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute showMessage={showMessage}>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dash"
            element={
              <ProtectedRoute showMessage={showMessage}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join"
            element={
              <ProtectedRoute showMessage={showMessage}>
                <JoinClassroom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute showMessage={showMessage}>
                <CreateClassroom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes/:code/create"
            element={
              <ProtectedRoute showMessage={showMessage}>
                <QuizCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes/:classCode/quizzes/:quizId/edit"
            element={
              <ProtectedRoute showMessage={showMessage}>
                <QuizEditPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
