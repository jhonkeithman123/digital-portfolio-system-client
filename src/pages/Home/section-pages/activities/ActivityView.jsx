import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../../../utils/apiClient";
import useMessage from "../../../../hooks/useMessage";
import ActivityComments from "../../../../components/ActivityComments";
import AnswerSubmission from "../../../../components/AnswerSubmission";
import TeacherInstructions from "../../../../components/TeacherInstructions";
import "./css/Activity.css";
import TokenGuard from "../../../../components/auth/tokenGuard";

const ActivityView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { messageComponent, showMessage } = useMessage();

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

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
        showMessage(data?.error || "Failed to load activity");
        navigate(-1);
      }
    } catch (e) {
      console.error("Activity load error", e);
      showMessage("Server error loading activity");
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
        showMessage("Session expired. Please login again", "error");
      }}
      loadingFallback={<div style={{ padding: 32 }}>Validating Session...</div>}
    >
      <div className="activity-view-page">
        <button className="activity-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    </TokenGuard>
  );
};
