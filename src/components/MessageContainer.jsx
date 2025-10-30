import { useEffect, useState } from 'react';
import './css/MessageContainer.css';

const MessageContainer = ({ type = 'info', message, onClose, duration = 3000 }) => {
    const [visible, setVisible] = useState(false);
    const [queueMessage, setQueueMessage] = useState('');

    useEffect(() => {
        if (!message || message === queueMessage) return;

        setQueueMessage(message);
        setVisible(true);

        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    return (
        <div className={`toast ${type} ${visible ? 'slide-down' : 'slide-up'}`}>
            <span>{message}</span>
            <button className='close-btn' onClick={() => {
                setVisible(false);
                if (onClose) onClose();
            }}>x</button>
        </div>
    );
}

export default MessageContainer;