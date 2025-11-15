import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/apiClient.js";
import useMessage from "../../hooks/useMessage";
import useLogout from "../../hooks/useLogout";
import TokenGuard from "../../components/auth/tokenGuard";
import "./CreateClassroom.css";

const CreateClassroom = () => {
  const navigate = useNavigate();
  const [logout, LogoutModal] = useLogout();

  const [name, setName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [section, setSection] = useState("");
  const { messageComponent, showMessage } = useMessage();

  const handleCreate = () => {
    if (!name || !schoolYear) {
      return showMessage("Please fill all fields.", "error");
    }
    const payload = { name, schoolYear };
    if (section.trim()) payload.section = section.trim();

    apiFetch(`/classrooms/create`, {
      method: "POST",
      body: JSON.stringify({ payload }),
    })
      .then(({ data, unauthorized }) => {
        if (unauthorized)
          return showMessage("Session expired. Please sign in again.", "error");
        if (data?.success) {
          showMessage("Successfully created a classroom", "success");
          navigate("/dash");
        } else {
          showMessage(data?.error || "Failed to create classroom.", "error");
        }
      })
      .catch(() => showMessage("Server error. Try again later.", "error"));
  };

  return (
    <TokenGuard
      redirectInfo="/login"
      onExpire={() =>
        showMessage("Session expired. Please sign in again.", "error")
      }
    >
      {messageComponent}

      <div className="create-classroom-wrapper">
        <div className="create-classroom-container">
          <h1>Create Your Advisory Classroom</h1>
          <input
            className="create-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Classroom Name"
          />
          <input
            className="create-input"
            type="text"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            placeholder="School Year (e.g. 2025-2026)"
          />
          <input
            className="create-input"
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="Section (e.g. STEM-2)"
          />
          <button className="create-button" onClick={handleCreate}>
            Create Classroom
          </button>
          <LogoutModal />
          <button className="create-button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </TokenGuard>
  );
};

export default CreateClassroom;
