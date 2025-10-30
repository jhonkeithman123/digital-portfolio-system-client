import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useMessage from "../../../hooks/useMessage";
import TokenGuard from "../../../components/auth/tokenGuard";
import "../Home.css";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// small helper to read token safely
function readToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

const Quizzes = ({ role, classroomCode }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  // keep token in state so UI reacts if it changes
  const [token, setToken] = useState(() => readToken());
  const { messageComponent, showMessage } = useMessage();
  const navigate = useNavigate();

  // prefer explicit prop, then user object in localStorage, then a simple key
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "null");
    console.log("Stored user:", storedUser);
  } catch (e) {
    storedUser = null;
  }
  // start with any locally-available code, but allow fetching server-side if missing
  const [classCode, setClassCode] = useState(
    classroomCode ||
      storedUser?.classroomCode ||
      storedUser?.currentClassroom ||
      localStorage.getItem("currentClassroom") ||
      null
  );

  // if we don't have a classroom code locally, ask the server (student or teacher endpoint)
  useEffect(() => {
    if (classCode) return;
    let mounted = true;
    (async () => {
      try {
        // refresh token from storage (log for debugging)
        const t = readToken();
        console.log("token:", t);
        // keep component state in sync with storage
        if (t !== token) setToken(t);
        const endpoint =
          role === "teacher" ? "/classrooms/teacher" : "/classrooms/student";
        const res = await fetch(`${API_BASE}${endpoint}`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
        });
        const data = await res.json();
        if (!mounted) return;
        if (data?.success) {
          // endpoint returns several shapes; prefer code field when present
          const serverCode =
            data.code ||
            data.classroom?.code ||
            data.code ||
            data.classroomCode ||
            data.classroomId ||
            null;
          if (serverCode) {
            setClassCode(serverCode);
            // persist for next loads
            try {
              localStorage.setItem("currentClassroom", serverCode);
            } catch {}
          }
        } else {
          console.warn("Failed to fetch classroom code from server:", data);
          showMessage(
            "Failed to determine classroom. Please select a classroom first.",
            "error"
          );
        }
      } catch (err) {
        console.error("Failed to request classroom code from server", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [classCode, role, showMessage, token]);

  useEffect(() => {
    if (!classCode) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const t = readToken();
        const res = await fetch(`${API_BASE}/quizes/${classCode}/quizzes`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
        });
        const data = await res.json();
        if (mounted && data?.success) setQuizzes(data.quizzes || []);
      } catch (e) {
        console.error("Failed to load quizzes", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [classCode]);

  function onCreate() {
    // prevent navigation when either classroom or token is missing
    const t = readToken();
    console.log("onCreate token:", t);
    if (!classCode) return showMessage("No classroom selected", "error");
    if (!t) {
      setToken(null);
      return showMessage("You must be signed in to create a quiz", "error");
    }
    navigate(`/quizes/${classCode}/create`);
  }

  function openQuiz(q) {
    const t = readToken();
    console.log("openQuiz token:", t);
    if (!classCode) return;
    if (!t) return showMessage("You must be signed in to view a quiz", "error");
    if (role === "teacher")
      navigate(`/quizes/${classCode}/quizzes/${q.id}/manage`);
    else navigate(`/quizes/${classCode}/quizzes/${q.id}`);
  }

  return (
    <TokenGuard redirectTo="/login" onExpire={() => showMessage("Session expired. Please sign in again.", "error")}>
      {messageComponent}

      <section className="home-card zone-section">
        <div className="quiz-header">
          <h2>Quizzes</h2>
          {role === "teacher" && (
            <button className="quiz-create-btn" onClick={onCreate}>
              <span className="quiz-btn-icon">+</span>
              Create Quiz
            </button>
          )}
        </div>

        {loading ? (
          <div className="quiz-empty-state">
            <p>Loading quizzes…</p>
          </div>
        ) : !quizzes.length ? (
          <div className="quiz-empty-state">
            <span className="quiz-icon">📝</span>
            <p>
              {role === "student"
                ? "No quizzes available yet"
                : "No quizzes created yet"}
            </p>
            <span className="quiz-subtitle">
              {role === "student"
                ? "Check back later for new quizzes from your teacher"
                : "Create your first quiz to get started"}
            </span>
          </div>
        ) : (
          <div className="quiz-list">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="quiz-item"
                onClick={() => openQuiz(q)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openQuiz(q)}
              >
                <div className="quiz-item-header">
                  <h3>{q.title}</h3>
                  <span
                    className={`quiz-status ${
                      q.start_time ? "published" : "draft"
                    }`}
                  >
                    {q.start_time ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="quiz-item-content">
                  <p className="quiz-description">{q.description || ""}</p>
                  <div className="quiz-meta">
                    <span>
                      Questions:{" "}
                      {(() => {
                        try {
                          const qs = JSON.parse(q.questions || "[]");
                          return qs.pages
                            ? qs.pages.reduce(
                                (acc, p) => acc + (p.questions?.length || 0),
                                0
                              )
                            : Array.isArray(qs)
                            ? qs.length
                            : 0;
                        } catch {
                          return "-";
                        }
                      })()}
                    </span>
                    <span>
                      Duration:{" "}
                      {q.time_limit_seconds
                        ? `${Math.ceil(q.time_limit_seconds / 60)} mins`
                        : "—"}
                    </span>
                    <span>
                      Start:{" "}
                      {q.start_time
                        ? new Date(q.start_time).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="quiz-actions">
                  {role === "teacher" ? (
                    <>
                      <button
                        className="quiz-action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/quizes/${classCode}/quizzes/${q.id}/edit`);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="quiz-action-btn view"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/quizes/${classCode}/quizzes/${q.id}/attempts`
                          );
                        }}
                      >
                        Attempts
                      </button>
                    </>
                  ) : (
                    <button
                      className="quiz-action-btn start"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuiz(q);
                      }}
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </TokenGuard>
  );
};

export default Quizzes;
