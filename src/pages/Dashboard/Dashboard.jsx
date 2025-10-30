import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import './Dashboard.css';
import useTamperGuard from "../../security/useTamperGuard";
import useMessage from "../../hooks/useMessage";
import useLogout from "../../hooks/useLogout";
import BurgerMenu from "../../components/burger_menu";
import StudentInvite from "../../components/StudentInvite";
import NotificationMenu from "../../components/NotificationMenu";
import InvNotificationMenu from "../classrooms/InvNotificationMenu";
import TokenGuard from "../../components/auth/tokenGuard";

const roleColors = {
    student: '#007bff',
    teacher: '#dc3545',
};
const reactAppUrl = process.env.REACT_APP_API_URL;

const Dashboard = () => {
    const navigate = useNavigate();
    const [logout, LogoutModal] = useLogout();
    const didInit = useRef(false);

    const [user, setUser] = useState(null);
    const [hasActivity, setHasActivity] = useState(false);
    const [checkingEnrollment, setCheckingEnrollment] = useState(true);
    const [classroomInfo, setClassroomInfo] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false); 

   const { messageComponent, showMessage } = useMessage();

    useTamperGuard(user?.role, showMessage);

    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;
        let timeoutId;

        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!storedUser || !token) {
            showMessage("Missing session data", "error");
            timeoutId = setTimeout(() => {
                return navigate('/login', { replace: true });
            }, 1500);
            return () => timeoutId && clearTimeout(timeoutId);
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            setUser((u) => (u && u.id === parsedUser.id ? u : parsedUser));
            const accentColor = roleColors[parsedUser.role] || '#6c757d';
            document.documentElement.style.setProperty('--accent-color', accentColor);
        } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return navigate('/login', { replace: true });
        }

        fetch(`${reactAppUrl}/auth/session`, {
            headers: { Authorization: `Bearer ${token}` }  
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login', { replace: true });
            }
        })
        .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login', { replace: true });
        });

        return () => timeoutId && clearTimeout(timeoutId);
    }, [navigate, showMessage]);

    useEffect(() => {
        if (user?.role === 'student') {
            const token = localStorage.getItem('token');

            fetch(`${reactAppUrl}/classrooms/student`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showMessage("Failed to check classroom enrollment", "error");
                } else if (!data.enrolled || !data.classroomId) {
                    console.log('Student not enrolled, redirecting to join page');
                    showMessage('Student not enrolled, redirecting to join page.');
                    navigate('/join');
                } else {
                    console.log('Student enrolled:', data);
                    setHasActivity(true);
                    setClassroomInfo({ 
                        name: data.name, 
                        code: data.code,
                        id: data.classroomId 
                    });
                }
            })
            .catch((err) => {
                console.error('Enrollment check error:', err);
                showMessage("Server error while checking classroom", "error");
            })
            .finally(() => {
                setCheckingEnrollment(false);
            });
        } else if (user?.role === 'teacher') {
            const token = localStorage.getItem('token');

            fetch(`${reactAppUrl}/classrooms/teacher`, {
            headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    showMessage("Failed to check classroom enrollment", "error");
                } else if (!data.created) {
                    navigate('/create');
                } else {
                    setHasActivity(true); // teacher has classrooms
                    setClassroomInfo({ name: data.name, code: data.code });
                }
            })
            .catch(() => {
                showMessage("Server error while checking classroom", "error");
            })
            .finally(() => {
                setCheckingEnrollment(false);
            });
        }
    }, [user, navigate, showMessage]);

    useEffect(() => {
        const handlePopState = () => {
            const token = localStorage.getItem('token');
            if (!token) {
                showMessage("Unauthorized access", "error");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState)
    }, [navigate, showMessage]);

    useEffect(() => {
        if(user?.role === 'student') {
            const activityExists = true;
            setHasActivity(activityExists);
        }
    }, [user]);

    if (!user || checkingEnrollment) return null;

    return (
        <TokenGuard redirectTo="/login" onExpire={() => showMessage("Session expired. Please sign in again.", "error")}>
            {inviteOpen && (
                <StudentInvite 
                    classroomCode={classroomInfo.code}
                    onClose={() => setInviteOpen(false)}
                    onInvite={(studentId) => showMessage(`Invited student ID ${studentId}`, 'info')}
                />
            )}

            {messageComponent}

            <BurgerMenu
                openMenu={menuOpen}
                toggleMenu={setMenuOpen}
                classroomInfo={classroomInfo}
            />

            <div className="notification-icon" onClick={() => setShowNotifications(prev => !prev)}>
                <svg className="svg" width="30" height="30" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a7 7 0 0 0-7 7v4.5l-1.7 2.6a1 1 0 0 0 .8 1.6h16a1 1 0 0 0 .8-1.6L19 13.5V9a7 7 0 0 0-7-7zm0 20a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22z"/>
                </svg>
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </div>

            {showNotifications && (
                <NotificationMenu 
                    setUnreadCount={setUnreadCount}
                    onClose={() => setShowNotifications(false)}
                />
            )}

            <div className="dashboard">
                <header className="dashboard-header">
                    <div className="dashboard-welcome">
                        <h1>Welcome, {user.name}</h1>
                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </div>
                </header>
                <main className="dashboard-main">
                    <section className="dashboard-card">
                        <h2>Recent Activity</h2>
                        <p>No Submission yet. Start by uploading your work!</p>

                        {(user.role === 'teacher' || (user.role === 'student' && hasActivity)) && (
                            <button
                                className="dashboard-button"
                                onClick={() => navigate('/home')}
                                style={{ marginTop: '1rem' }}
                            >
                                Go to Upload Page
                            </button>
                        )}
                    </section>

                    <section className="dashboard-card">
                        <h2>Quizes Scores</h2>
                        {user.role === 'teacher' ? (
                            <>
                                <p>You haven't uploaded any quizzes yet. Go to the upload page to post one.</p>
                                <button className="dashboard-button" onClick={() => navigate("/home")} >Upload a Quiz</button>
                            </>
                        ) : (
                            <p>No Quizes yet. Wait for your teacher to post one.</p>
                        )}
                    </section>

                    <section className="dashboard-card">
                        <h2>Feedback Summary</h2>
                        {user.role === 'teacher' ? (
                            <>
                                <p>You have not yet given feedback summary to student works. Give one tot he upload page.</p>
                                <button className="dashboard-button" onClick={() => navigate("/home")}>Give feedback</button>
                            </>
                        ) : (
                            <p>No feedback available. Check back after your teacher reviews your work.</p>
                        )}
                    </section>
                </main>

                <footer className="dashboard-footer">
                        <div className="footer-button-container">
                            {user.role === 'teacher' && classroomInfo && (
                                <button 
                                    className="dashboard-button"
                                    onClick={() => setInviteOpen(true)}
                                    style={{ marginBottom: '1rem' }}    
                                >
                                    Invite Students
                                </button>
                            )}

                            <LogoutModal />
                            <button className="dashboard-button" onClick={logout}>Logout</button>
                        </div>
                    <div>@ 2025 Digital Portfolio System</div>
                </footer>
            </div>
        </TokenGuard>
    );
};

export default Dashboard;