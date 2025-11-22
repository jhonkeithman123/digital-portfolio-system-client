import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../utils/apiClient.js";
import QuizTimer from "../../components/QuizTimer";
import useMessage from "../../hooks/useMessage.jsx";
import TokenGuard from "../auth/tokenGuard.jsx";

export default function QuizAttempt({ classroomCode, quizId }) {
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // {questionId: value}
  const [loading, setLoading] = useState(false);

  const { messageComponent, showMessage } = useMessage();
  const showMsgRef = useRef(showMessage);

  useEffect(() => {
    showMsgRef.current = showMessage;
  }, [showMessage]);

  useEffect(() => {
    async function load() {
      const { unauthorized, data } = await apiFetch(
        `/quizzes/${classroomCode}/quizzes/${quizId}`
      );
      if (unauthorized) {
        showMsgRef.current("Session expired. Please sign in again.", "error");
        return;
      }
      if (data?.success) {
        // backend returns quiz.questions — teacher shape might be pages wrapped; normalize
        const questionsRaw = data.quiz.questions || {};
        const pages =
          questionsRaw.pages ||
          (Array.isArray(questionsRaw)
            ? [{ id: "page-1", title: "All", questions: questionsRaw }]
            : []);
        setQuiz({ ...data.quiz, pages });
      } else {
        showMsgRef.current("Cannot load quiz");
      }
    }
    load();
  }, [classroomCode, quizId]);

  async function startAttempt() {
    setLoading(true);
    const { unauthorized, data: d } = await apiFetch(
      `/quizzes/${classroomCode}/quizzes/${quizId}/attempt`,
      { method: "POST" }
    );
    setLoading(false);
    if (unauthorized) {
      showMsgRef.current("Session expired. Please sign in again.", "error");
      return;
    }
    if (d.success) {
      setAttemptId(d.attemptId);
      setExpiresAt(d.expiresAt ? new Date(d.expiresAt) : null);
    } else {
      showMsgRef.current(d.message || "Could not start attempt");
    }
  }

  function setAnswer(qId, value) {
    setAnswers((s) => ({ ...s, [qId]: value }));
  }

  async function submitAttempt() {
    const { unauthorized, data: d } = await apiFetch(
      `/quizzes/${classroomCode}/quizzes/${quizId}/submit`,
      { method: "POST", body: JSON.stringify({ attemptId, answers }) }
    );
    if (unauthorized) {
      showMsgRef.current("Session expired. Please sign in again.", "error");
      return;
    }
    if (d.success) {
      showMsgRef.current("Submitted. Score: " + d.score + "%");
      // optionally redirect or show results
    } else {
      showMsgRef.current("Submit failed: " + (d.message || JSON.stringify(d)));
    }
  }

  if (!quiz) return <div style={{ padding: 16 }}>Loading...</div>;

  const page = quiz.pages[pageIndex] || { questions: [] };

  return (
    <TokenGuard
      redirectInfo="/login"
      onExpire={() =>
        showMsgRef.current("Session expired. Please sign in again.", "error")
      }
    >
      {messageComponent}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2>{quiz.title}</h2>
          {expiresAt && (
            <QuizTimer
              expiresAt={new Date(expiresAt)}
              onExpire={() =>
                showMsgRef.current("Time's up — submitting automatically")
              }
            />
          )}
        </div>

        {!attemptId ? (
          <div>
            <p>{quiz.description}</p>
            <button onClick={startAttempt} disabled={loading}>
              {loading ? "Starting..." : "Start Attempt"}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 12 }}>
              <strong>{page.title || `Page ${pageIndex + 1}`}</strong>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {page.questions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    border: "1px solid #eee",
                    padding: 12,
                    borderRadius: 6,
                  }}
                >
                  <div style={{ marginBottom: 8 }}>{q.text}</div>

                  {q.type === "multiple_choice" &&
                    (q.options || []).map((opt, oi) => (
                      <label
                        key={oi}
                        style={{ display: "block", marginBottom: 6 }}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={oi}
                          checked={String(answers[q.id]) === String(oi)}
                          onChange={() => setAnswer(q.id, String(oi))}
                        />{" "}
                        {opt}
                      </label>
                    ))}

                  {q.type === "checkboxes" &&
                    (q.options || []).map((opt, oi) => {
                      const arr = answers[q.id] || [];
                      const checked =
                        Array.isArray(arr) && arr.includes(String(oi));
                      return (
                        <label key={oi} style={{ display: "block" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const set = new Set(arr);
                              if (e.target.checked) set.add(String(oi));
                              else set.delete(String(oi));
                              setAnswer(q.id, Array.from(set));
                            }}
                          />{" "}
                          {opt}
                        </label>
                      );
                    })}

                  {(q.type === "short_answer" || q.type === "paragraph") && (
                    <textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={q.type === "paragraph" ? 6 : 2}
                      style={{ width: "100%" }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <div>
                <button
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  disabled={pageIndex === 0}
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPageIndex((i) => Math.min(quiz.pages.length - 1, i + 1))
                  }
                  disabled={pageIndex >= quiz.pages.length - 1}
                  style={{ marginLeft: 8 }}
                >
                  Next
                </button>
              </div>

              <div>
                <button onClick={submitAttempt}>Submit Attempt</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TokenGuard>
  );
}
