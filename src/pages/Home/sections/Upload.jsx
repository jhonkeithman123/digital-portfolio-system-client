import TokenGuard from "../../../components/auth/tokenGuard";
import { useState } from "react";
import "../Home.css";

const FileUpload = ({ role, file, onFileChange, onUpload, showMessage }) => {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");

  const [isDragging, setIsDragging] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "application/vnd.opnxmlformats-officedocuments.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const validateFile = (file) => {
    if (!file) return false;

    if (!allowedTypes.includes(file.type)) {
      showMessage(
        "Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.",
        "error"
      );
      return false;
    }

    if (file.size > maxSize) {
      showMessage("File is too large. Maximum size is 5MB.", "error");
      return false;
    }

    return true;
  };

  const canSubmit =
    !!file && title.trim().length > 0 && instructions.trim().length > 0;

  const handleSubmit = () => {
    if (!title.trim()) {
      showMessage("Please enter a title for the activity.", "error");
      return;
    }
    if (!instructions.trim()) {
      showMessage("Please add instructions for the activity.", "error");
      return;
    }
    if (!file) {
      showMessage("Please select a file.", "error");
      return;
    }
    // Send combined payload upward
    onUpload?.({
      title: title.trim(),
      instructions: instructions.trim(),
      file,
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (validateFile(droppedFile)) {
      onFileChange({ target: { files: [droppedFile] } });
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
        <h2>{role === "student" ? "Submit Your Work" : "Upload Activity"}</h2>

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
          <p>Drag and drop your file here or</p>
          <input
            type="file"
            id="file-input"
            className="file-input-hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (validateFile(file)) {
                onFileChange(e);
              }
            }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <label htmlFor="file-input" className="file-input-label">
            Choose File
          </label>
          <p className="file-types">
            Allowed: PDF, DOC, DOCX, JPG, PNG (max 5MB)
          </p>
        </div>

        {file && (
          <div className="file-preview">
            <div className="file-info">
              <span className="file-icon">📎</span>
              <div className="file-details">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              className="file-remove"
              onClick={() => {
                onFileChange({ target: { files: [] } });
                showMessage("File removed", "info");
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
          {canSubmit
            ? "Submit Activity"
            : "Fill title, instructions, and pick a file"}
        </button>
      </section>
    </TokenGuard>
  );
};

export default FileUpload;
