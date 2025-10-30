import React from "react";

const Header = () => (
    <header style={styles.header}>
        <h1>Digital Portfolio System</h1>
    </header>
);

const styles = {
    header: {
        display: 'flex',
        fontSize: '1.2rem',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem', 
        background: '#222', 
        color: '#fff', 
        height: '60px',
    }
    
}

export default Header;
