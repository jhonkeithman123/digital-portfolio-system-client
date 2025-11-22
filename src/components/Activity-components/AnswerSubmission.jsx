import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { apiFetch } from "../../utils/apiClient";
import useMessage from "../../hooks/useMessage";
import "./css/AnswerSubmission.css";
import TokenGuard from "../auth/tokenGuard";

const AnswerSubmission = ({ activityId, onSubmitted }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);

  const { messageComponent, showMessage } = useMessage();

  const showMsgRef = useRef(showMessage);

  useEffect(() => {
    showMsgRef.current = showMessage;
  }, [showMessage]);

  const submit = async () => {
    if (!text.trim() && !file) {
      showMsgRef.current("Add an answer or attach a file.", "error");
      return;
    }
    setSending(true);

    try {
      const fd = new FormData();
      fd.append("text", text.trim());

      if (file) fd.append("file", file);

      const { data } = await apiFetch(
        `/activity/${encodeURIComponent(activityId)}/submit`,
        {
          method: "POST",
          body: fd,
          form: true,
        }
      );

      if (data?.success) {
        setText("");
        setFile(null);

        if (onSubmitted) onSubmitted();
        showMsgRef.current("Submitted", "success");
      } else showMsgRef.current(data?.error || "Failed to submit", "error");
    } catch (e) {
      console.error("Submit error:", e);
      showMsgRef.current("Server error", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <TokenGuard
      redirectInfo="/login"
      onExpire={() => {
        showMsgRef.current("Session expired. Please sign in again.", "error");
      }}
      loadingFallback={<div style={{ padding: 32 }}>Validation Session...</div>}
    >
      {messageComponent}
      <section className="answer-submission">
        <h4>Submit your answer</h4>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your answer..."
        ></textarea>
        <input
          type="text"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="actions">
          <button onClick={submit} disabled={sending}>
            {sending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </section>
    </TokenGuard>
  );
};

AnswerSubmission.proptypes = {
  activityId: PropTypes.string.isRequired,
  onSubmitted: PropTypes.func,
};

export default AnswerSubmission;
