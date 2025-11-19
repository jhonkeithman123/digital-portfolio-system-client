import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { apiFetch } from "../utils/apiClient";
import useMessage from "../hooks/useMessage";
import "./css/ActivityComments.css";
import TokenGuard from "./auth/tokenGuard";

const ActivityComments = ({ activityId }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageComponent, showMessage] = useMessage();

  const load = async () => {
    setLoading(true);

    try {
      const { data } = await apiFetch(
        `/activity/${encodeURIComponent(activityId)}/comments`
      );
      if (data?.success) setComments(data.comments || []);
      else console.debug("Comments load:", data);
    } catch (e) {
      console.error("Comments load err", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activityId]);

  const submit = async () => {
    if (!text.trim()) return;

    try {
      const { data } = await apiFetch(
        `/activity/${encodeURIComponent(activityId)}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ text: text.trim() }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (data?.success) {
        setText("");
        setComments((p) => [
          {
            id: data.id,
            text: data.text,
            author: data.author,
            createdAt: data.createdAt,
          },
          ...p,
        ]);
      } else {
        showMessage(data?.error || "Failed to post comment", "error");
      }
    } catch (e) {
      console.error(e);
      showMessage("Server error", "error");
    }
  };
  return (
    <TokenGuard
      redirectInfo="/login"
      onExpire={() => {
        showMessage("Session expired. Please sign in again.", "error");
      }}
      loadingFallback={<div style={{ padding: 32 }}>Validating Session...</div>}
    >
      <section className="activity-comments">
        <h4>Comments</h4>
        <div className="comment-form">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
          ></textarea>
          <button onClick={submit} disabled={!text.trim()}>
            Post
          </button>
        </div>

        {loading ? (
          <p>Loading Comments...</p>
        ) : (
          <ul className="comments-list">
            {comments.length === 0 ? (
              <li className="empty">No comments yet.</li>
            ) : (
              comments.map((c) => {
                <li key={c.id} className="comment">
                  <div className="meta">
                    <strong>{c.author?.name ?? c.authorName ?? "User"}</strong>
                    <time datetime="">
                      {new Date(c.createdAt || c.created_at).toLocaleString()}
                    </time>
                  </div>
                  <div className="body">{c.text}</div>
                </li>;
              })
            )}
          </ul>
        )}
      </section>
    </TokenGuard>
  );
};

ActivityComments.proptypes = {
  activityId: PropTypes.string.isRequired,
};

export default ActivityComments;
