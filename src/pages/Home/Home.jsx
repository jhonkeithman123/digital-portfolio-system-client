import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import useMessage from "../../hooks/useMessage";
import Submissions from "./sections/Submissions";
import Quizzes from "./sections/Quizzes";
import FileUpload from "./sections/Upload";
import Header from "../../components/Header";
import useLogout from "../../hooks/useLogout";
import TokenGuard from "../../components/auth/tokenGuard";
import { apiFetch } from "../../utils/apiClient.js";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [logout, LogoutModal] = useLogout();
  const didInit = useRef(false);

  const [role, setRole] = useState("");
  const [user, setUser] = useState(null);
  const [classroomInfo, setClassroomInfo] = useState(null);
  const [loadingClassroom, setLoadingClassroom] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const { messageComponent, showMessage } = useMessage();

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    try {
      const cached = JSON.parse(localStorage.getItem("user") || "null");
      if (cached) {
        setUser(cached);
        setRole(cached.role || "");
      }
    } catch {}
    // validate session via cookie
    (async () => {
      const { unauthorized, data } = await apiFetch("/auth/session");
      if (unauthorized || !data?.success) {
        showMessage("Missing or expired session. Please log in.", "error");
        navigate("/login", { replace: true });
        return;
      }
      if (data.user) {
        setUser(data.user);
        setRole(data.user.role || "");
        try {
          localStorage.setItem("user", JSON.stringify(data.user));
        } catch {}
      }
    })();
  }, [navigate, showMessage]);

  // Fetch teacher classroom code after user loaded
  useEffect(() => {
    if (!user || user.role !== "teacher") return;

    let ignore = false;
    const loadClassroom = async () => {
      setLoadingClassroom(true);

      try {
        const { data } = await apiFetch("/classrooms/teacher");
        if (!ignore) {
          if (data?.success && data.created) {
            setClassroomInfo({
              id: data.classroomId,
              code: data.code,
              name: data.name,
              section: data.section ?? null,
            });
          } else {
            showMessage("No classroom created yet.", "info");
          }
        }
      } catch (e) {
        console.error("Error loading classroom:", e);
        if (!ignore) showMessage("Failed to load classroom", "error");
      } finally {
        if (!ignore) setLoadingClassroom(false);
      }
    };
    loadClassroom();
    return () => {
      ignore = true;
    };
  }, [user]);

  //* Will be enabled later

  if (!user) return null;

  return (
    <TokenGuard
      redirectInfo="/login"
      onExpire={() =>
        showMessage("Session expired. Please sign in again.", "error")
      }
    >
      {messageComponent}

      <div className="home-container">
        <Header
          variant="authed"
          user={user}
          section={user.role === "student" ? user.section : null}
          headerClass="home-header"
          welcomeClass="home-welcome"
        />

        <main className="home-main">
          {role === "teacher" ? (
            loadingClassroom ? (
              <section className="home-card">
                <h2>Upload Activity</h2>
                <p>Loading Classroom...</p>
              </section>
            ) : (
              <FileUpload
                role={role}
                showMessage={showMessage}
                classroomCode={classroomInfo?.code}
              />
            )
          ) : (
            <section className="home-card empty-upload">
              <h2>Recent Activity</h2>
              <p>
                No Uploaded activities yet. Wait for the teacher to upload one.
              </p>
            </section>
          )}

          <Quizzes role={role} />

          <Submissions
            role={role}
            submissions={submissions}
            selectedSubmission={selectedSubmission}
            feedback={feedback}
            isSaving={isSaving}
            onSubmissionSelect={(e) => {
              const selected = submissions.find((s) => s.id === e.target.value);
              setSelectedSubmission(selected);
              setFeedback(selected?.feedback || "");
            }}
            onFeedbackChange={(e) => setFeedback(e.target.value)}
            onSaveFeedback={() => {
              if (!selectedSubmission) return;
              setIsSaving(true);
              apiFetch(`/submission/${selectedSubmission.id}/feedback`, {
                method: "POST",
                body: JSON.stringify({ feedback }),
              })
                .then(({ data }) => {
                  if (data.success) {
                    showMessage("Feedback saved successfully!", "success");
                  } else {
                    showMessage("Failed to save feedback", "error");
                  }
                })
                .catch(() => showMessage("Server error", "error"))
                .finally(() => setIsSaving(false));
            }}
          />

          <section className="home-card">
            <button
              className="dashboard-button"
              onClick={() => navigate("/dash")}
            >
              Back to Dashboard
            </button>
          </section>
        </main>

        <footer className="home-footer">
          <LogoutModal />
          <button className="dashboard-button" onClick={logout}>
            Logout
          </button>
          <div>@ 2025 Digital Portfolio System</div>
        </footer>
      </div>
    </TokenGuard>
  );
};

export default Home;
