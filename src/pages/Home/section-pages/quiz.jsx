import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import useMessage from "../../../hooks/useMessage";
import "./quiz.css";

const API_BASE = process.env.REACT_APP_API_URL;

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export default function QuizEditor({ classroomCode }) {
  const [title, setTitle] = useState("Untitled Quiz");
  const [pages, setPages] = useState([{ id: uid("page-"), title: "Page 1", questions: [] }]);
  const { messageComponent, showMessage } = useMessage();

  // NEW: quiz settings
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(""); // blank = no limit

  function addPage() {
    setPages((p) => [...p, { id: uid("page-"), title: `Page ${p.length + 1}`, questions: [] }]);
  }
  function addQuestion(pageId, type = "multiple_choice") {
    setPages((p) =>
      p.map((pg) =>
        pg.id === pageId
          ? {
              ...pg,
              questions: [
                ...pg.questions,
                type === "multiple_choice"
                  ? { id: uid("q-"), type, text: "New question", options: ["", "", "", ""], correctAnswer: null }
                  : type === "checkboxes"
                  ? { id: uid("q-"), type, text: "New question", options: ["", "", "", ""], correctAnswer: [] }
                  : type === "short_answer"
                  ? { id: uid("q-"), type, text: "New question", sentenceLimit: 1, correctAnswer: "" }
                  : { id: uid("q-"), type: "paragraph", text: "New question", sentenceLimit: 3, correctAnswer: "" }
              ],
            }
          : pg
      )
    );
  }

  function updateQuestion(pageId, qId, patch) {
    setPages((p) =>
      p.map((pg) => (pg.id === pageId ? { ...pg, questions: pg.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)) } : pg))
    );
  }

  function onDragEnd(result) {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "PAGE") {
      const next = Array.from(pages);
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);
      setPages(next);
      return;
    }

    const srcPageIdx = pages.findIndex((p) => p.id === source.droppableId);
    const dstPageIdx = pages.findIndex((p) => p.id === destination.droppableId);
    if (srcPageIdx < 0 || dstPageIdx < 0) return;

    const srcPage = { ...pages[srcPageIdx] };
    const dstPage = srcPageIdx === dstPageIdx ? srcPage : { ...pages[dstPageIdx] };

    const srcQs = Array.from(srcPage.questions);
    const [movedQ] = srcQs.splice(source.index, 1);

    if (srcPageIdx === dstPageIdx) {
      srcQs.splice(destination.index, 0, movedQ);
      const next = [...pages];
      next[srcPageIdx] = { ...srcPage, questions: srcQs };
      setPages(next);
    } else {
      const dstQs = Array.from(dstPage.questions);
      dstQs.splice(destination.index, 0, movedQ);
      const next = [...pages];
      next[srcPageIdx] = { ...srcPage, questions: srcQs };
      next[dstPageIdx] = { ...dstPage, questions: dstQs };
      setPages(next);
    }
  }

  async function saveQuiz() {
    if (!classroomCode) return showMessage("No classroom selected", "error");

    // sanitize
    const attempts = Math.max(1, parseInt(attemptsAllowed || 1, 10));
    const mins = parseInt(timeLimitMinutes, 10);
    const timeLimitSeconds = Number.isFinite(mins) && mins > 0 ? mins * 60 : null;

    const payload = {
      title,
      questions: { pages },
      attemptsAllowed: attempts,
      startTime: null,
      endTime: null,
      timeLimitSeconds,
    };

    try {
      const resp = await fetch(`${API_BASE}/quizes/${classroomCode}/quizzes/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      showMessage(data.success ? "Quiz saved" : "Error saving quiz", data.success ? "success" : "error");
    } catch (err) {
      showMessage("Server error saving quiz", "error");
    }
  }

  return (
    <>
      {messageComponent}
      <section className="quiz-card">
        <div className="quiz-header" style={{ alignItems: "center" }}>
          <div className="quiz-title-wrap">
            <input
              className="qe-input quiz-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder="Enter the title of your quiz"
              aria-label="Quiz title"
            />
            <div className="quiz-subtitle" style={{ marginTop: 6, fontSize: 13 }}>
              Quiz editor — drag pages and questions to reorder
            </div>
          </div>

            <div className="quiz-controls">
              <label className="qc-field">
                <span className="qc-label">Attempts</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="qe-input qc-number"
                  value={attemptsAllowed}
                  onChange={(e) => setAttemptsAllowed(e.target.value)}
                />
              </label>
              <label className="qc-field">
                <span className="qc-label">Time limit</span>
                <div className="qc-time">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="qe-input qc-number"
                    placeholder="mins"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value)}
                  />
                  <span className="qc-suffix">min</span>
                </div>
              </label>

              <div className="qc-actions">
                <button className="quiz-button" onClick={addPage}>+ Page</button>
                <button className="quiz-button" onClick={() => addQuestion(pages[0].id)}>+ Question</button>
                <button className="quiz-action-btn view" onClick={saveQuiz}>Save</button>
              </div>
            </div>
          </div>          

        <div className="qe-editor">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="pages" type="PAGE" direction="horizontal">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="qe-pages">
                  {pages.map((pg, idx) => (
                    <Draggable draggableId={pg.id} index={idx} key={pg.id}>
                      {(dragProvided) => (
                        <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className="page-card" style={dragProvided.draggableProps.style}>
                          <div className="page-header">
                            <input className="qe-input page-title" value={pg.title} onChange={(e) => setPages(p => p.map(x => x.id === pg.id ? { ...x, title: e.target.value } : x))} />
                            <div className="page-controls">
                              <button className="qe-btn" onClick={() => addQuestion(pg.id)}>+Q</button>
                            </div>
                            <div {...dragProvided.dragHandleProps} className="drag-handle" aria-hidden>☰</div>
                          </div>

                          <Droppable droppableId={pg.id} type="QUESTION" direction="vertical" ignoreContainerClipping={true}>
                            {(qProvided) => (
                              <div ref={qProvided.innerRef} {...qProvided.droppableProps} className="question-list">
                                {pg.questions.map((q, qidx) => (
                                  <Draggable draggableId={q.id} index={qidx} key={q.id}>
                                    {(qi) => (
                                      <div ref={qi.innerRef} {...qi.draggableProps} className="question-card" style={qi.draggableProps.style}>
                                        <div className="question-top">
                                          <div {...qi.dragHandleProps} className="drag-handle">☰</div>
                                          <input className="qe-input qe-question-text" value={q.text} onChange={(e) => updateQuestion(pg.id, q.id, { text: e.target.value })} />
                                          <select className="qe-select" value={q.type} onChange={(e) => updateQuestion(pg.id, q.id, { type: e.target.value })}>
                                            <option value="multiple_choice">Multiple choice</option>
                                            <option value="short_answer">Short answer</option>
                                            <option value="paragraph">Paragraph</option>
                                            <option value="checkboxes">Checkboxes</option>
                                          </select>
                                        </div>

                                        { (q.type === "multiple_choice" || q.type === "checkboxes") && (
                                          <>
                                            <div className="qa-label">Options</div>
                                              <div className="options">
                                                {(q.options || []).map((opt, oi) => {
                                                  const isCb = q.type === "checkboxes";
                                                  const isCorrect =
                                                    q.type === "multiple_choice"
                                                      ? String(oi) === String(q.correctAnswer ?? "")
                                                      : Array.isArray(q.correctAnswer) && q.correctAnswer.includes(oi);
                                                  return (
                                                    <div key={oi} className="opt-row">
                                                      <input
                                                        className="qe-input"
                                                        value={opt}
                                                        placeholder={`Option ${oi + 1}`}
                                                        onChange={(e) => {
                                                          const opts = [...(q.options || [])];
                                                          opts[oi] = e.target.value;
                                                          updateQuestion(pg.id, q.id, { options: opts });
                                                        }}
                                                      />
                                                      {isCb ? (
                                                        <label className="opt-correct">
                                                          <input
                                                            type="checkbox"
                                                            checked={isCorrect}
                                                            onChange={() => {
                                                              const arr = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [];
                                                              const idx = arr.indexOf(oi);
                                                              if (idx >= 0) arr.splice(idx, 1);
                                                              else arr.push(oi);
                                                              updateQuestion(pg.id, q.id, { correctAnswer: arr });
                                                            }}
                                                          />
                                                          Correct
                                                        </label>
                                                      ) : (
                                                        <button
                                                          className={`qe-btn small${isCorrect ? " active" : ""}`}
                                                          title="Mark as correct"
                                                          onClick={() => updateQuestion(pg.id, q.id, { correctAnswer: String(oi) })}
                                                        >
                                                          ✓
                                                        </button>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                                <button
                                                  className="qe-btn ghost"
                                                  onClick={() => updateQuestion(pg.id, q.id, { options: [...(q.options || []), ""] })}
                                                >
                                                  + Option
                                                </button>
                                              </div>
                                          </>
                                        )}

                                        {q.type === "short_answer" && (
                                          <div className="qa-section">
                                            <div className="qa-label">Answer</div>
                                            <input
                                              className="qe-input"
                                              placeholder="Correct short answer"
                                              value={q.correctAnswer || ""}
                                              onChange={(e) => updateQuestion(pg.id, q.id, { correctAnswer: e.target.value })}
                                            />
                                            <label className="qa-inline">
                                              <span>Sentences allowed</span>
                                              <input
                                                type="number"
                                                min={1}
                                                max={3}
                                                className="qe-input qa-number"
                                                value={q.sentenceLimit ?? 1}
                                                onChange={(e) => {
                                                  const v = Math.max(1, Math.min(3, parseInt(e.target.value || "1", 10)));
                                                  updateQuestion(pg.id, q.id, { sentenceLimit: v });
                                                }}
                                              />
                                            </label>
                                          </div>
                                        )}

                                        {q.type === "paragraph" && (
                                          <div className="qa-section">
                                            <div className="qa-label">Answer</div>
                                            <textarea
                                              className="qe-input"
                                              rows={3}
                                              placeholder="Expected answer or rubric (optional)"
                                              value={q.correctAnswer || ""}
                                              onChange={(e) => updateQuestion(pg.id, q.id, { correctAnswer: e.target.value })}
                                            />
                                            <label className="qa-inline">
                                              <span>Sentences required</span>
                                              <input
                                                type="number"
                                                min={3}
                                                className="qe-input qa-number"
                                                value={q.sentenceLimit ?? 3}
                                                onChange={(e) => {
                                                  const n = parseInt(e.target.value || "3", 10);
                                                  const v = Number.isFinite(n) ? Math.max(3, n) : 3;
                                                  updateQuestion(pg.id, q.id, { sentenceLimit: v });
                                                }}
                                              />
                                            </label>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {qProvided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </section>
    </>
  );
}