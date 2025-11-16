import TokenGuard from "../../../components/auth/tokenGuard";
import { useEffect, useState } from "react";
import "../Home.css";
import { apiFetch } from "../../../utils/apiClient";

const FileUpload = ({ role, classroomCode, showMessage }) => {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];
  const maxSize = 5 * 1024 * 1024;
  const fmtDate = (d) => new Date(d).toLocaleDateString();

  const validateFile = (f) => {
    if (!f) return false;
    if (!allowedTypes.includes(f.type)) {
      showMessage("Invalid type: PDF, DOC, DOCX, JPG, PNG only.", "error");
      return false;
    }
    if (f.size > maxSize) {
      showMessage("File exceeds 5MB.", "error");
      return false;
    }
    return true;
  };

  const pickFile = (f) => {
    if (validateFile(f)) setFile(f);
  };

  // Fetch activities for this classroom (teacher student)
  useEffect(() => {
    if (!classroomCode) return;

    let ignore = false;
    const load = async () => {
      setLoadingActivities(true);

      try {
        const { data } = await apiFetch(`/activity/classroom/${classroomCode}`);
        if (!ignore) {
          if (data?.success) setActivities(data.activities || []);
          else showMessage(data?.error || "Failed to load activities", "error");
        }
      } catch (e) {
        if (!ignore) showMessage("Server error loading activities.", "error");
      } finally {
        if (!ignore) setLoadingActivities(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [classroomCode]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  };

  const canSubmit =
    role === "teacher" &&
    !!classroomCode &&
    title.trim() &&
    instructions.trim() &&
    !creating;

  const disabledReason = (() => {
    if (role !== "teacher") return "Teacher only";
    if (!classroomCode) return "No classroom code";
    if (!title.trim()) return "Missing title";
    if (!instructions.trim()) return "Missing instructions";
    if (creating) return "Submitting...";
    return "";
  })();

  const handleSubmit = async () => {
    if (!canSubmit) {
      showMessage(disabledReason || "Complete required fields", "error");
      return;
    }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("instructions", instructions.trim());
      fd.append("classroomCode", classroomCode);
      if (file) fd.append("file", file); // only append if provided

      const { data } = await apiFetch("/activity/create", {
        method: "POST",
        body: fd,
        form: true,
      });

      if (!data?.success) {
        showMessage(data?.error || "Failed to create activity.", "error");
      } else {
        showMessage("Activity created.", "success");
        setActivities((prev) => [
          {
            id: data.id,
            title: title.trim(),
            instructions: instructions.trim(),
            original_name: file?.name || null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setTitle("");
        setInstructions("");
        setFile(null);
      }
    } catch {
      showMessage("Server error.", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <TokenGuard
      redirectInfo="/login"
      onExpire={() =>
        showMessage("Session expired. Please sign in again.", "error")
      }
    >
      <section className="home-card">
        <h2>{role === "teacher" ? "Upload Activity" : "Activities"}</h2>

        {role === "teacher" ? (
          <>
            <div className="upload-form">
              <div className="form-row">
                <label htmlFor="activity-title">Title</label>
                <input
                  id="activity-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g., Reflection Essay #1"
                />
              </div>
              <div className="form-row">
                <label htmlFor="activity-instructions">Instructions</label>
                <textarea
                  id="activity-instructions"
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  maxLength={1000}
                  placeholder="Add clear instructions for this activity…"
                />
              </div>
            </div>

            <div
              className={`upload-zone ${isDragging ? "dragging" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="upload-icon">📄</div>
              <p>Optional: drag & drop a file or</p>
              <input
                type="file"
                id="file-input"
                className="file-input-hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickFile(f);
                }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-input" className="file-input-label">
                Choose File
              </label>
              <p className="file-types">
                (Optional) Allowed: PDF, DOC, DOCX, JPG, PNG (max 5MB)
              </p>
            </div>

            {file && (
              <div className="file-preview">
                <div className="file-info">
                  <span className="file-icon">📎</span>
                  <div className="file-details">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  className="file-remove"
                  onClick={() => {
                    setFile(null);
                    showMessage("File removed.", "info");
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <button
              className={`upload-button ${!canSubmit ? "disabled" : ""}`}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {creating
                ? "Submitting"
                : canSubmit
                ? "Create Activity"
                : disabledReason}
            </button>

            <hr
              style={{
                margin: "18px 0",
                border: "none",
                borderTop: "1px solid #eee",
              }}
            />
            <h3 style={{ marginTop: 0 }}>Activities in this classroom</h3>
          </>
        ) : (
          <>
            {!classroomCode ? (
              <p>Join a classroom to see activities.</p>
            ) : loadingActivities ? (
              <p>Loading activities…</p>
            ) : null}
          </>
        )}

        {classroomCode && !loadingActivities && (
          <div className="activity-list" style={{ marginTop: 12 }}>
            {activities.length === 0 ? (
              <p>No activities yet.</p>
            ) : (
              <ul className="activities-ul">
                {activities.map((a) => (
                  <li key={a.id} className="activity-item">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <strong>{a.title}</strong>
                      <span className="activity-date">
                        {fmtDate(a.created_at)}
                      </span>
                    </div>
                    <div className="activity-instructions">
                      {a.instructions?.slice(0, 160)}
                      {a.instructions?.length > 160 && "…"}
                    </div>
                    {a.original_name && (
                      <span className="activity-file-name">
                        {a.original_name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </TokenGuard>
  );
};

export default FileUpload;
