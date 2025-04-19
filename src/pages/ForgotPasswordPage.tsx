import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Assuming you use react-router-dom

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const { sendPasswordResetEmail, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Clear previous message
    clearError();   // Clear previous error

    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(email);
      setMessage('Password reset email sent! Please check your inbox (and spam folder).');
      setEmail(''); // Clear email field on success
    } catch (err) {
      // Error is already set in AuthContext, but we can add a generic message here if needed
      setMessage('Failed to send password reset email. Please try again.');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <p>Enter your email address below, and we'll send you a link to reset your password.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      {message && <p>{message}</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <div>
        <Link to="/auth">Back to Login</Link> {/* Adjust link as needed */}
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 