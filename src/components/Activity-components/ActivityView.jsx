import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/apiClient";
import useMessage from "../../hooks/useMessage";
import ActivityComments from "./ActivityComments";
import AnswerSubmission from "./AnswerSubmission";
import TeacherInstructions from "./TeacherInstructions";
import "./css/Activity.css";
import TokenGuard from "../auth/tokenGuard";

const ActivityView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { messageComponent, showMessage } = useMessage();

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  const showMsgRef = useRef(showMessage);

  useEffect(() => {
    showMsgRef.current = showMessage;
  }, [showMessage]);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const loadActivity = async () => {
    setLoading(true);

    try {
      const { data } = await apiFetch(`/activity/${encodeURIComponent(id)}`);

      if (data?.success) setActivity(data.activity);
      else {
        showMsgRef.current(data?.error || "Failed to load activity");
        navigate(-1);
      }
    } catch (e) {
      console.error("Activity load error", e);
      showMsgRef.current("Server error loading activity");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="activity-view-page">Loading...</div>;
  if (!activity)
    return <div className="activity-view-page">Activity not found</div>;

  const createdAt = activity.created_at || activity.createdAt;

  return (
    <TokenGuard
      redirectInfo="/login"
      onExpire={() => {
        showMsgRef.current("Session expired. Please login again", "error");
      }}
      loadingFallback={<div style={{ padding: 32 }}>Validating Session...</div>}
    >
      {messageComponent}

      <div className="activity-view-page">
        <button className="activity-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    </TokenGuard>
  );
};
