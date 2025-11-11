import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TokenGuard from "../../../components/auth/tokenGuard";
import useMessage from "../../../hooks/useMessage";
import "./quiz-review.css";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export default function QuizReviewPage() {
  const params = useParams();
  const classCode = params.classCode || params.classroomCode || params.code;
  const quizId = params.quizId;
  const navigate = useNavigate();
  const { messageComponent, showMessage } = useMessage();

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [selected, setSelected] = useState(null); // attempt object
  const [gradingScore, setGradingScore] = useState("");
  const [gradingComment, setGradingComment] = useState("");
  const [gradingPayload, setGradingPayload] = useState({}); // optional per-question grading data
  const [filter, setFilter] = useState("needs_grading");

  // refs for abort + throttling
  const attemptsControllerRef = useRef(null);
  const lastFetchRef = useRef(0);
  const mountedRef = useRef(true);

  async function loadAttempts() {
    // throttle: don't run more than once per second
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) return;
    lastFetchRef.current = now;

    // abort previous in-flight request
    if (attemptsControllerRef.current) {
      attemptsControllerRef.current.abort();
      attemptsControllerRef.current = null;
    }
    const ac = new AbortController();
    attemptsControllerRef.current = ac;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/quizes/${classCode}/quizzes/${quizId}/attempts?status=${encodeURIComponent(
          filter
        )}`,
        {
          signal: ac.signal,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = await res.json();
      if (!mountedRef.current) return;
      if (!data?.success) {
        showMessage(data?.message || "Failed to load attempts", "error");
        setAttempts([]);
        return;
      }
      setAttempts(data.attempts || []);
    } catch (err) {
      if (err.name === "AbortError") {
        // expected when we abort previous requests
        return;
      }
      console.error("load attempts", err);
      showMessage("Server error", "error");
    } finally {
      if (mountedRef.current) setLoading(false);
      attemptsControllerRef.current = null;
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    loadAttempts();
    // reload when visibility/focus but throttle to avoid spam
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFetchRef.current < 1000) return;
      loadAttempts();
    };
    window.addEventListener("focus", onFocus);
    // also refresh when tab becomes visible
    const onVisibility = () => {
      if (!document.hidden) onFocus();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (attemptsControllerRef.current) {
        attemptsControllerRef.current.abort();
        attemptsControllerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    console.debug("[QuizReviewPage] params", { classCode, quizId });
  }, [classCode, quizId]);

  function openAttempt(a) {
    setSelected(a);
    setGradingScore(a.score != null ? String(a.score) : "");
    setGradingComment("");
    setGradingPayload(a.grading || {});
  }

  async function submitGrade() {
    if (!selected) return;
    const scoreNum = Number(gradingScore);
    if (!Number.isFinite(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      showMessage("Score must be 0-100", "error");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/quizes/${classCode}/quizzes/${quizId}/attempts/${selected.id}/grade`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score: scoreNum,
            grading: gradingPayload,
            comment: gradingComment,
          }),
        }
      );
      const data = await res.json();
      if (!data?.success) {
        showMessage(data?.message || "Failed to save grade", "error");
        return;
      }
      showMessage("Attempt graded", "success");
      // refresh list and close detail
      await loadAttempts();
      setSelected(null);
    } catch (err) {
      console.error("submit grade", err);
      showMessage("Server error", "error");
    }
  }

  return (
    <TokenGuard
      redirectTo="/login"
      onExpire={() =>
        showMessage("Session expired. Please sign in again.", "error")
      }
    >
      {messageComponent}
      <div className="quiz-review-shell">
        <section className="quiz-card">
          <div className="quiz-card-content">
            <div className="qr-header">
              <div className="qr-title">
                <span className="qr-eyebrow">Teacher</span>
                <h2>Review Attempts</h2>
              </div>

              <div className="qr-controls">
                <label className="qr-filter">
                  <span>Show</span>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="needs_grading">Needs grading</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="all">All</option>
                  </select>
                </label>
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>
                  Back
                </button>
                <button className="btn btn-primary" onClick={loadAttempts}>
                  Reload
                </button>
              </div>
            </div>

            <div className="qr-body">
              <aside className="quiz-attempt-list">
                {loading ? (
                  <div className="qr-empty">Loading…</div>
                ) : attempts.length ? (
                  <ul>
                    {attempts.map((a) => (
                      <li
                        key={a.id}
                        className={`qr-item ${
                          selected?.id === a.id ? "is-active" : ""
                        }`}
                      >
                        <div className="qr-item-left">
                          <div className="qr-avatar">
                            {(
                              a.student_name ||
                              a.student_username ||
                              "?"
                            ).slice(0, 1)}
                          </div>
                          <div className="qr-item-meta">
                            <div className="qr-item-name">
                              {a.student_name || a.student_username}
                            </div>
                            <div className="attempt-meta">
                              Attempt #{a.attempt_no}
                            </div>
                          </div>
                        </div>

                        <div className="qr-item-right">
                          <span className={`chip status-${a.status}`}>
                            {a.status.replace("_", " ")}
                          </span>
                          <span className="qr-score">
                            {a.score != null ? `${a.score}%` : "—"}
                          </span>
                          <button
                            className="btn btn-small"
                            onClick={() => openAttempt(a)}
                          >
                            Grade / View
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="qr-empty">No attempts</div>
                )}
              </aside>

              <section className="attempt-detail">
                {!selected && (
                  <div className="qr-placeholder">
                    Select an attempt to review
                  </div>
                )}

                {selected && (
                  <div className="qr-detail">
                    <div className="qr-detail-head">
                      <div>
                        <div className="qr-detail-name">
                          {selected.student_name || selected.student_username}
                        </div>
                        <div className="attempt-meta">
                          Attempt #{selected.attempt_no} • {selected.status}
                        </div>
                      </div>
                      <div className="qr-detail-score">
                        {selected.score != null ? `${selected.score}%` : "—"}
                      </div>
                    </div>

                    <div className="attempt-answers panel">
                      <h4>Answers</h4>
                      {Object.entries(selected.answers || {}).length === 0 && (
                        <div className="qr-empty-sm">No answers</div>
                      )}
                      {Object.entries(selected.answers || {}).map(
                        ([qid, ans]) => (
                          <div key={qid} className="attempt-answer">
                            <div className="qid">Question {qid}</div>
                            <div className="ans">
                              {Array.isArray(ans)
                                ? ans.join(", ")
                                : String(ans)}
                            </div>

                            <div className="qr-row">
                              <input
                                className="input"
                                placeholder="points (optional)"
                                value={gradingPayload[qid]?.points ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setGradingPayload((p) => ({
                                    ...p,
                                    [qid]: { ...(p[qid] || {}), points: v },
                                  }));
                                }}
                              />
                              <input
                                className="input"
                                placeholder="feedback (optional)"
                                value={gradingPayload[qid]?.feedback ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setGradingPayload((p) => ({
                                    ...p,
                                    [qid]: { ...(p[qid] || {}), feedback: v },
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="qr-grade-bar">
                      <label className="qr-grade-field">
                        <span>Score %</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="input"
                          value={gradingScore}
                          onChange={(e) => setGradingScore(e.target.value)}
                        />
                      </label>

                      <input
                        className="input grow"
                        placeholder="Overall comment (optional)"
                        value={gradingComment}
                        onChange={(e) => setGradingComment(e.target.value)}
                      />

                      <button className="btn btn-primary" onClick={submitGrade}>
                        Save grade
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>
    </TokenGuard>
  );
}
