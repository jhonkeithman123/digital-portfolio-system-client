import React, { useState } from "react";
import PropTypes from "prop-types";
import useMessage from "../hooks/useMessage";
import { apiFetch } from "../utils/apiClient";
import "./css/TeacherInstructions.css";
import TokenGuard from "./auth/tokenGuard";

/**
 ** Simple editor to update instructions on an existing activity.
 ** PATCH /activity/:id/instructions { instructions }
 */
const TeacherInstructions = ({ activityId, currentInstructions, onSaved }) => {
  const [text, setText] = useState(currentInstructions || "");
  const [saving, setSaving] = useState(false);

  const { messageComponent, showMessage } = useMessage();

  const save = async () => {
    setSaving(true);

    try {
      const { data } = await apiFetch(
        `/activity/${encodeURIComponent(activityId)}/instructions`,
        {
          method: "PATCH",
          body: JSON.stringify({ instructions: text }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (data?.success) {
        showMessage("Instructions updated", "success");
        if (onSaved) onSaved(text);
      } else showMessage(data?.error || "Failed to save", "error");
    } catch (e) {
      console.error("Save instr err", e);
      showMessage("Server error", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TokenGuard
      redirectInfo="/login"
      onExpire={() => {
        showMessage("Session expired, please login again.", "error");
      }}
      loadingFallback={<div style={{ padding: 32 }}>Validation Session...</div>}
    >
      {messageComponent}
      <section className="teacher-instructions">
        <h4>Teacher: Edit instructions</h4>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
        <div className="instr-actions">
          <button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </section>
    </TokenGuard>
  );
};

TeacherInstructions.proptypes = {
  activityId: PropTypes.string.isRequired,
  currentInstructions: PropTypes.string,
  onSaved: PropTypes.func,
};

export default TeacherInstructions;
