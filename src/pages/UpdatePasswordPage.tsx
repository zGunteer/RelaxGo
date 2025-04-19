import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Adjust path as needed
import { Input } from '@/components/ui/input';   // Assuming shared UI components
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [recoveryTokenFound, setRecoveryTokenFound] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for password recovery event triggered by the email link
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery event detected.');
        setRecoveryTokenFound(true); // Enable the form
        setError(null); // Clear any previous errors
        setMessage('You can now set your new password.');
      } else if (event === 'SIGNED_IN') {
        // If user somehow gets signed in differently, maybe redirect?
        // navigate('/home'); 
      }
    });

    // Check if there's already a session (e.g., page refresh after link click)
    // This might not be strictly necessary if onAuthStateChange handles it, but can be a fallback
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            // A session exists, check if it's potentially from a recovery link
            // Note: Supabase handles the password update flow implicitly after the link click.
            // The important part is that updateUser will work now.
            console.log('Session found on load.');
            // We might assume recovery is possible if a session exists here
            // setRecoveryTokenFound(true); 
            //setMessage('Enter your new password.');
        }
    });


    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
        // You might want to enforce Supabase's actual password requirements here
        setError('Password must be at least 6 characters long.');
        return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage('Password updated successfully! You can now log in with your new password.');
      setPassword(''); // Clear password field
      // Optionally redirect to login after a short delay
      setTimeout(() => navigate('/auth'), 3000); 

    } catch (err) {
      console.error('Password update error:', err);
      const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred updating password';
      setError(`Failed to update password: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Initially, wait for the recovery token detection via onAuthStateChange
  // Or, you could attempt the update immediately and let Supabase handle the error if no recovery token is present
  // if (!recoveryTokenFound) {
  //   return <div>Verifying recovery link... If you didn't click a password reset link, please request one first.</div>;
  // }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Set New Password</h2>
      {/* Render form only when recovery seems possible, or always render and let Supabase error handle */} 
      <form onSubmit={handlePasswordUpdate}>
        <div style={{ marginBottom: '15px' }}>
          <Label htmlFor="new-password">New Password:</Label>
          <Input
            type="password"
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6} // Basic client-side check
            disabled={loading}
            placeholder="Enter your new password"
          />
        </div>
        <Button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
      {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default UpdatePasswordPage; 