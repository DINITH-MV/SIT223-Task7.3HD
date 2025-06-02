import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { handleSuccess } from '../utils';
import { ToastContainer } from 'react-toastify';
import './Home.css'; // Create this CSS file for additional styles

function Home() {
    const [loggedInUser, setLoggedInUser] = useState('');
    const navigate = useNavigate();
    
    useEffect(() => {
        setLoggedInUser(localStorage.getItem('loggedInUser'))
    }, [])

    const handleLogout = (e) => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        handleSuccess('User Logged out');
        setTimeout(() => {
            navigate('/login');
        }, 1000)
    }

    return (
        <div className="dashboard-container">
            {/* Header with user profile in corner */}
            <header className="dashboard-header">
                <h1>User profile</h1>
                <div className="user-profile">
                    <span className="username">Welcome, {loggedInUser}</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </header>
            
            {/* Main dashboard content */}
            
            
            <ToastContainer />
        </div>
    )
}

export default Home