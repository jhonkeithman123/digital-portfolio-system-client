import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useMessage from "../../../hooks/useMessage";
import QuizEditor from "./quiz";
import TokenGuard from "../../../components/auth/tokenGuard";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

function toPagesFromServerQuestions(raw) {
  // server may store either an array of questions or { pages: [...] }
  // Normalize to [{ id, title, questions }]
  try {
    const q = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (q && Array.isArray(q.pages)) return q.pages;
    if (Array.isArray(q)) return [{ id: "page-1", title: "Page 1", questions: q }];
  } catch {}
  return [{ id: "page-1", title: "Page 1", questions: [] }];
}

export default function QuizEditPage() {
  const { classCode, quizId } = useParams();
  const { messageComponent, showMessage } = useMessage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  const token = useMemo(() => {
    try {
      return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token") ||
        ""
      );
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!classCode || !quizId) {
          showMessage("Missing classroom or quiz id", "error");
          navigate("/home");
          return;
        }
        const res = await fetch(`${API_BASE}/quizes/${classCode}/quizzes/${quizId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.status === 401 || res.status === 403) {
          showMessage("Session expired. Please sign in again.", "error");
          navigate("/login");
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        if (!data?.success) {
          showMessage(data?.message || "Failed to load quiz", "error");
          navigate(`/quizes/${classCode}/quizzes`);
          return;
        }
        const qz = data.quiz || data.data || {};
        const pages = toPagesFromServerQuestions(qz.questions);
        setInitialData({
          title: qz.title || "Untitled Quiz",
          attemptsAllowed: qz.attempts_allowed ?? 1,
          timeLimitSeconds: qz.time_limit_seconds ?? null,
          pages,
          quizId,
          mode: "edit",
        });
      } catch (e) {
        console.error("Failed to load quiz", e);
        showMessage("Server error loading quiz", "error");
        navigate(`/quizes/${classCode}/quizzes`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [classCode, quizId, navigate, showMessage, token]);

  if (loading) return <section className="quiz-card"><div style={{ padding: 16 }}>Loading…</div>{messageComponent}</section>;
  if (!initialData) return <section className="quiz-card"><div style={{ padding: 16 }}>Quiz not found</div>{messageComponent}</section>;

  return (
    <TokenGuard redirectTo="/login" onExpire={() => showMessage("Session expired. Please sign in again.", "error")}>
      {messageComponent}
      <QuizEditor classroomCode={classCode} initialData={initialData} />
    </TokenGuard>
  );
}