import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Adjust path as needed

// Interface based on schema
interface Review {
  id: number; // PK is int4 in schema
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  booking_id: number | null; // FK is int4 in schema
}

// Basic Web Components
const ListItemContainer = ({ children }: { children: React.ReactNode }) => <div style={{ backgroundColor: '#f9f9f9', padding: '15px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #eee' }}>{children}</div>;
const TextItem = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: '14px', marginBottom: '5px' }}>{children}</p>;
const CenteredText = ({ children }: { children: React.ReactNode }) => <p style={{ textAlign: 'center', marginTop: '20px' }}>{children}</p>;
const ErrorText = ({ children }: { children: React.ReactNode }) => <p style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>{children}</p>;
const LoadingIndicator = () => <CenteredText>Loading...</CenteredText>;

function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, booking_id')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReviews(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews');
      console.error("Error fetching reviews:", err);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const renderItem = (item: Review) => {
     const reviewDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
     return (
        <ListItemContainer key={item.id}>
            <TextItem>Rating: {item.rating ? `${item.rating}/5` : 'N/A'}</TextItem>
            <TextItem>Comment: {item.comment || 'No comment.'}</TextItem>
            <TextItem>Date: {reviewDate}</TextItem>
            <TextItem>Booking ID: {item.booking_id ?? 'N/A'}</TextItem> 
        </ListItemContainer>
     );
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorText>Error: {error}</ErrorText>;
  }

  return (
    <div>
        <button onClick={() => fetchReviews(false)} style={{ marginBottom: '10px' }}>Refresh Reviews</button>
        {reviews.length === 0
            ? <CenteredText>No reviews found.</CenteredText>
            : reviews.map(renderItem)
        }
    </div>
  );
}

export default ReviewsTab; 