import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import useMessage from "../../hooks/useMessage";
import Submissions from "./sections/Submissions";
import Quizzes from "./sections/Quizzes";
import FileUpload from "./sections/Upload";
import './Home.css';
import useLogout from "../../hooks/useLogout";
import TokenGuard from "../../components/auth/tokenGuard";

const Home = () => {
    const navigate = useNavigate();
    const [logout, LogoutModal] = useLogout();
    const didInit = useRef(false);

    const [role, setRole] = useState('');
    const [user, setUser] = useState(null);
    const [file, setFile] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [submissions, ] = useState([]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const { messageComponent, showMessage } = useMessage();

    const reactAppUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !storedUser.role) {
      showMessage("Missing session data. Please log in again.", "error");
      navigate('/login', { replace: true });
      return;
    }
    setRole((r) => (r === storedUser.role ? r : storedUser.role));
    setUser((u) => (u && u.id === storedUser.id ? u : storedUser));
  }, [navigate, showMessage]);

    //* Will be enabled later
    // useEffect(() => {
    //     const fetchSubmissions = async () => {
    //         const token = localStorage.getItem('token');
    //         try {
    //             const response = await fetch(`${reactAppUrl}/submissions`, {
    //                 headers: { Authorization: `Bearer ${token}` }
    //             });
    //             const data = await response.json();
    //             if (data.success) {
    //                 setSubmissions(data.submissions);
    //             }
    //         } catch (error) {
    //             showMessage("Failed to fetch submissions", "error");
    //         }
    //     };

    //     if (user) {
    //         fetchSubmissions();
    //     }
    // }, [user, reactAppUrl, showMessage]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        setFile(selected);
    };

    const handleUpload = () => {
        if (!file) return showMessage("Please select a file", "error");

        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append('file', file);
        formData.append('role', role);

        fetch(`${reactAppUrl}/home/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showMessage("File uploaded successfully!", "success");
                setFile(null);
            } else {
                showMessage(data.error || "Upload failed", "error");
            }
        })
        .catch(() => showMessage("Server error", "error"));
    };

    if (!user) return null;

     return (
        <TokenGuard redirectTo="/login" onExpire={() => showMessage("Session expired. Please sign in again.", "error")}>
            {messageComponent}
            
            <div className="home-container">
                <header className="home-header">
                    <div className="home-welcome">
                        <h1>Welcome, {user.name}</h1>
                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </div>
                </header>

                <main className="home-main">
                    <FileUpload 
                        role={role}
                        file={file}
                        onFileChange={handleFileChange}
                        onUpload={handleUpload}
                        showMessage={showMessage}
                    />
                    
                    <Quizzes role={role} />
                    
                    <Submissions 
                        role={role}
                        submissions={submissions}
                        selectedSubmission={selectedSubmission}
                        feedback={feedback}
                        isSaving={isSaving}
                        onSubmissionSelect={(e) => {
                            const selected = submissions.find(s => s.id === e.target.value);
                            setSelectedSubmission(selected);
                            setFeedback(selected?.feedback || '');
                        }}
                        onFeedbackChange={(e) => setFeedback(e.target.value)}
                        onSaveFeedback={() => {
                            if (!selectedSubmission) return;
                            setIsSaving(true);
                            const token = localStorage.getItem("token");
                            fetch(`${process.env.REACT_APP_API_URL}/submission/${selectedSubmission.id}/feedback`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({ feedback })
                            })
                            .then(res => res.json())
                            .then(data => {
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
                        <button className="dashboard-button" onClick={() => navigate("/dash")}>
                            Back to Dashboard
                        </button>
                    </section>
                </main>

                <footer className="home-footer">
                    <LogoutModal />
                    <button className="dashboard-button" onClick={logout}>Logout</button>
                    <div>@ 2025 Digital Portfolio System</div>
                </footer>
            </div>
        </TokenGuard>
    );
};

export default Home;