import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../utils/apiClient.js";
import useMessage from "../../../hooks/useMessage";
import TokenGuard from "../../../components/auth/tokenGuard";
import useConfirm from "../../../hooks/useConfirm";
import "../Home.css";

const Quizzes = ({ role, classroomCode }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { messageComponent, showMessage } = useMessage();
  const [confirm, ConfirmModal] = useConfirm();

  const navigate = useNavigate();
  const showMsgRef = useRef(showMessage);

  useEffect(() => {
    showMsgRef.current = showMessage;
  }, [showMessage]);

  // prefer explicit prop, then user object in localStorage, then a simple key
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "null");
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
        const endpoint =
          role === "teacher" ? "/classrooms/teacher" : "/classrooms/student";
        const { data } = await apiFetch(endpoint);
        if (!mounted) return;
        if (data?.success) {
          // endpoint returns several shapes; prefer code field when present
          const serverCode =
            data.code ||
            data.classroom?.code ||
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
          showMsgRef.current(
            "Failed to determine classroom. Please select a classroom first.",
            "error"
          );
        }
      } catch (err) {
        showMsgRef.current("[QUIZZES] Server Error", "error");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [classCode, role]);

  useEffect(() => {
    if (!classCode) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const { data } = await apiFetch(`/quizzes/${classCode}/quizzes`);
        if (mounted && data?.success) setQuizzes(data.quizzes || []);
      } catch (e) {
        showMsgRef.current("Failed to load quizzes", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [classCode]);

  function onCreate() {
    navigate(`/quizzes/${classCode}/create`);
  }

  function openQuiz(q) {
    if (!classCode) return;
    if (role === "teacher")
      navigate(`/quizzes/${classCode}/quizzes/${q.id}/manage`);
    else navigate(`/quizzes/${classCode}/quizzes/${q.id}`);
  }

  async function deleteQuiz(q) {
    const ok = await confirm({
      title: "Delete quiz",
      message: `Delete "${q.title}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!ok) return;

    try {
      const { data } = await apiFetch(`/quizzes/${classCode}/quizzes/${q.id}`, {
        method: "DELETE",
      });
      if (data?.success) {
        setQuizzes((list) => list.filter((x) => x.id !== q.id));
        showMsgRef.current("Quiz deleted", "success");
      } else {
        showMsgRef.current(data?.message || "Failed to delete quiz", "error");
      }
    } catch (e) {
      showMsgRef.current("Server error", "error");
    }
  }

  return (
    <TokenGuard
      redirectInfo="/login"
      onExpire={() =>
        showMsgRef.current("Session expired. Please sign in again.", "error")
      }
    >
      {messageComponent}
      <ConfirmModal />
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
                      Items:{" "}
                      {typeof q.questions_count === "number"
                        ? q.questions_count
                        : typeof q.question_count === "number"
                        ? q.question_count
                        : "-"}
                    </span>
                    <span>
                      Time:{" "}
                      {q.time_limit_seconds
                        ? `${Math.ceil(q.time_limit_seconds / 60)} min`
                        : "—"}
                    </span>
                    <span>
                      Attempts:{" "}
                      {typeof q.attempts_allowed === "number"
                        ? q.attempts_allowed
                        : q.attemptsAllowed ?? "—"}
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
                          navigate(
                            `/quizzes/${classCode}/quizzes/${q.id}/edit`
                          );
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="quiz-action-btn view"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/quizzes/${classCode}/quizzes/${q.id}/attempts`
                          );
                        }}
                      >
                        Attempts
                      </button>
                      <button
                        className="quiz-action-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuiz(q);
                        }}
                      >
                        Delete
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
                  {/* show Review button for teachers */}
                  {role === "teacher" && (
                    <button
                      className="dashboard-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("[ReviewAttempts] navigating with", {
                          classCode,
                          quizId: q.id,
                        });
                        navigate(
                          `/quizzes/${classCode}/quizzes/${q.id}/review`
                        );
                      }}
                      disabled={!classCode}
                      title={!classCode ? "Resolving classroom…" : ""}
                      style={{ marginLeft: 8 }}
                    >
                      Review attempts
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
