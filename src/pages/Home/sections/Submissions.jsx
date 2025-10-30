import useMessage from '../../../hooks/useMessage';
import TokenGuard from '../../../components/auth/tokenGuard';
import '../Home.css';

const Submissions = ({ 
    role, 
    submissions, 
    selectedSubmission, 
    feedback, 
    isSaving,
    onSubmissionSelect, 
    onFeedbackChange, 
    onSaveFeedback 
}) => {
    const { messageComponent, showMessage } = useMessage();
    return (
        <TokenGuard redirectTo="/login" onExpire={() => showMessage("Session expired. Please sign in again.", "error")}>
            {messageComponent}
            <section className="home-card">
            <h2>Submissions & Feedback</h2>
            {role === 'teacher' ? (
                <>
                    <div className="submissions-list">
                        {submissions.length > 0 ? (
                            <>
                                <select 
                                    className="submission-select"
                                    value={selectedSubmission ? selectedSubmission.id : ''}
                                    onChange={onSubmissionSelect}
                                >
                                    <option value="">Select a submission...</option>
                                    {submissions.map(submission => (
                                        <option key={submission.id} value={submission.id}>
                                            {submission.studentName} - {submission.activityName} 
                                            ({new Date(submission.submittedAt).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                                
                                {selectedSubmission && (
                                    <div className="submission-details">
                                        <p><strong>Student:</strong> {selectedSubmission.studentName}</p>
                                        <p><strong>Activity:</strong> {selectedSubmission.activityName}</p>
                                        <p><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                                        <a 
                                            href={selectedSubmission.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="view-submission-btn"
                                        >
                                            View Submission
                                        </a>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <span className="empty-icon">📥</span>
                                <p>No submissions to review yet</p>
                            </div>
                        )}
                    </div>

                    <div className="feedback-container">
                        <textarea 
                            className="feedback-textarea" 
                            value={feedback} 
                            onChange={onFeedbackChange} 
                            placeholder="Select a submission and provide your feedback here..."
                            rows={8}
                            disabled={!selectedSubmission}
                        />
                    </div>
                    <div className="feedback-status">
                        <span className="status-indicator">
                            {feedback ? `${feedback.length} characters` : 'Empty feedback'}
                        </span>
                        <button
                            className="upload-button"
                            onClick={onSaveFeedback}
                            disabled={isSaving || !feedback.trim() || !selectedSubmission}
                        >
                            {isSaving ? (
                                <span className="button-content">
                                    <span className="spinner">Saving...</span>
                                </span>
                            ) : (
                                'Save Feedback'
                            )}
                        </button>
                    </div>
                </>
            ) : (
                <div className="student-submissions">   
                    {submissions.length > 0 ? (
                        submissions.map(submission => (
                            <div key={submission.id} className="submission-item">
                                <h3>{submission.activityName}</h3>
                                <p><strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}</p>
                                {submission.feedback ? (
                                    <div className="feedback-content">
                                        <h4>Teacher's Feedback:</h4>
                                        <p>{submission.feedback}</p>
                                    </div>
                                ) : (
                                    <p className="pending-feedback">Waiting for teacher's feedback</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <span className="empty-icon">📝</span>
                            <p>You haven't submitted any work yet</p>
                        </div>
                    )}
                </div>
            )}
        </section>
        </TokenGuard>
    );
};

export default Submissions;