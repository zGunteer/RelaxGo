import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { supabase } from '@/lib/supabaseClient'; // Import supabase
// Removed RN/Navigation imports
import UsersTab from '@/components/admin/UsersTab';
import MasseusesTab from '@/components/admin/MasseusesTab';
import BookingsTab from '@/components/admin/BookingsTab';
import ReviewsTab from '@/components/admin/ReviewsTab';

// Simple web components for structure
const WebContainer = ({ children }: { children: React.ReactNode }) => <div style={{ flex: 1, marginTop: '20px', padding: '10px' }}>{children}</div>;
const HeaderContainer = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #ccc', marginBottom: '10px' }}>{children}</div>;
const TabButtonContainer = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'flex', flexDirection: 'row', padding: '10px', borderBottom: '1px solid #ccc' }}>{children}</div>;
const TabContentContainer = ({ children }: { children: React.ReactNode }) => <div style={{ flex: 1, padding: '10px' }}>{children}</div>;

const AdminPanelScreen = () => {
    const navigate = useNavigate(); // Hook for navigation
    const [activeTab, setActiveTab] = React.useState('Users');

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error.message);
            alert("Failed to log out: " + error.message); // Basic error feedback
        } else {
            navigate('/auth', { replace: true }); // Navigate to login screen
        }
    };

    const handleApplicationsClick = () => {
        navigate('/admin/applications');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Users': return <UsersTab />;
            case 'Masseuses': return <MasseusesTab />;
            case 'Bookings': return <BookingsTab />;
            case 'Reviews': return <ReviewsTab />;
            case 'Applications': 
                return (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <h2>Masseur Applications</h2>
                        <p>Manage pending masseur applications and approve/reject them.</p>
                        <button 
                            onClick={handleApplicationsClick}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                marginTop: '10px'
                            }}
                        >
                            Manage Applications
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    // Basic web tab buttons (inline styles for simplicity)
    const getButtonStyle = (tabName: string) => ({
        marginRight: '10px',
        padding: '8px 12px',
        border: 'none',
        background: activeTab === tabName ? '#eee' : 'transparent',
        cursor: 'pointer',
        fontWeight: activeTab === tabName ? 'bold' : 'normal'
    } as React.CSSProperties); // Type assertion for style object

    const logoutButtonStyle: React.CSSProperties = {
         padding: '8px 12px',
         border: '1px solid #ccc',
         background: '#f8f8f8',
         cursor: 'pointer',
         color: 'red',
         fontWeight: 'bold'
    };

    return (
        <WebContainer>
            {/* Header with Title and Logout Button */}
            <HeaderContainer>
                 <h1 style={{ fontSize: '1.5em', fontWeight: 'bold' }}>Admin Panel</h1>
                 <button onClick={handleLogout} style={logoutButtonStyle}>Log Out</button>
            </HeaderContainer>

            {/* Tab Buttons */}
            <TabButtonContainer>
                <button onClick={() => setActiveTab('Users')} style={getButtonStyle('Users')}>Users</button>
                <button onClick={() => setActiveTab('Masseuses')} style={getButtonStyle('Masseuses')}>Masseuses</button>
                <button onClick={() => setActiveTab('Applications')} style={getButtonStyle('Applications')}>Applications</button>
                <button onClick={() => setActiveTab('Bookings')} style={getButtonStyle('Bookings')}>Bookings</button>
                <button onClick={() => setActiveTab('Reviews')} style={getButtonStyle('Reviews')}>Reviews</button>
            </TabButtonContainer>
            
            {/* Tab Content */}
            <TabContentContainer>
                {renderContent()}
            </TabContentContainer>
        </WebContainer>
    );
};

export default AdminPanelScreen; 