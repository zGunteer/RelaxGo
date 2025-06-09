import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Adjust path as needed

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string | null;
  is_active: boolean | null;
}

// Basic Web Components (replace with your UI library if available)
const ListItemContainer = ({ children }: { children: React.ReactNode }) => <div style={{ backgroundColor: '#f9f9f9', padding: '15px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #eee' }}>{children}</div>;
const TextItem = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: '14px', marginBottom: '5px' }}>{children}</p>;
const CenteredText = ({ children }: { children: React.ReactNode }) => <p style={{ textAlign: 'center', marginTop: '20px' }}>{children}</p>;
const ErrorText = ({ children }: { children: React.ReactNode }) => <p style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>{children}</p>;
const LoadingIndicator = () => <CenteredText>Loading...</CenteredText>;
const ActionButton = ({ title, onClick, color, disabled }: { title: string; onClick: () => void; color?: string; disabled?: boolean }) => (
    <button onClick={onClick} style={{ color: color, margin: '5px 0', cursor: disabled ? 'not-allowed' : 'pointer' }} disabled={disabled}>
        {title}
    </button>
);

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // State for update loading
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, first_name, last_name, phone, role, is_active')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      console.error("Error fetching users:", err);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (userId: string, currentStatus: boolean | null) => {
     if (currentStatus === null) {
        window.alert('Error: User status is unknown.');
        return;
     }
     const newStatus = !currentStatus;
     const action = newStatus ? 'reactivate' : 'suspend';

     if (window.confirm(`Are you sure you want to ${action} this user?`)) {
        setIsUpdating(true);
        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({ is_active: newStatus })
                .eq('id', userId);

            if (updateError) throw updateError;

            // Refresh list visually without full reload
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? { ...user, is_active: newStatus } : user
                )
            );
            window.alert(`Success: User ${action}d.`);
        } catch (err: any) {
            window.alert(`Error: ${err.message || 'Failed to update user status.'}`);
            console.error("Error updating user status:", err);
        } finally {
             setIsUpdating(false);
        }
     }
  };

  const renderItem = (item: User) => (
    <ListItemContainer key={item.id}>
      <TextItem>Name: {item.first_name || ''} {item.last_name || ''}</TextItem>
      <TextItem>Phone: {item.phone || 'N/A'}</TextItem>
      <TextItem>Role: {item.role || 'N/A'}</TextItem>
      <TextItem>Status: {item.is_active === null ? 'Unknown' : item.is_active ? 'Active' : 'Suspended'}</TextItem>
      <ActionButton
        title={item.is_active === null ? 'Unknown Status' : item.is_active ? 'Suspend' : 'Reactivate'}
        onClick={() => handleToggleActive(item.id, item.is_active)}
        color={item.is_active === null ? 'grey' : item.is_active ? 'red' : 'green'}
        disabled={item.is_active === null || isUpdating} // Disable button during update
      />
    </ListItemContainer>
  );

  if (loading) { // Show loading only on initial fetch
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorText>Error: {error}</ErrorText>;
  }

  return (
    <div>
      <button onClick={() => fetchUsers(false)} disabled={isUpdating} style={{ marginBottom: '10px' }}>Refresh Users</button>
      {users.length === 0
        ? <CenteredText>No users found.</CenteredText>
        : users.map(renderItem)
      }
    </div>
  );
}

export default UsersTab; 