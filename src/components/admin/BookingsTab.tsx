import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Adjust path as needed

// Define interfaces based on expected Supabase query result structure & schema
interface UserInfo {
    first_name: string | null;
    last_name: string | null;
}

interface MassageTypeInfo {
    name: string | null;
}

interface Booking {
  id: number; // PK is int4 in schema
  scheduled_time: string | null;
  duration_minutes: number | null;
  status: string | null;
  // Joined data based on schema FKs:
  customer: UserInfo | null; // FK: customer_id -> users.id
  masseuse: UserInfo | null; // FK: masseuse_id -> masseuses.masseuse_id -> users.id 
  massage_types: MassageTypeInfo | null; // FK: massage_type_id -> massage_types.id
}

// Basic Web Components
const ListItemContainer = ({ children }: { children: React.ReactNode }) => <div style={{ backgroundColor: '#f9f9f9', padding: '15px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #eee' }}>{children}</div>;
const TextItem = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: '14px', marginBottom: '5px' }}>{children}</p>;
const CenteredText = ({ children }: { children: React.ReactNode }) => <p style={{ textAlign: 'center', marginTop: '20px' }}>{children}</p>;
const ErrorText = ({ children }: { children: React.ReactNode }) => <p style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>{children}</p>;
const LoadingIndicator = () => <CenteredText>Loading...</CenteredText>;

function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    setError(null);
    try {
       const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          customer:users!bookings_customer_id_fkey ( first_name, last_name ), 
          masseuse:masseuses!inner ( users!inner(first_name, last_name) ), 
          massage_types ( name )
        `)
        .order('scheduled_time', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedData = (data || []).map(item => ({
        ...item,
        customer: item.customer as UserInfo | null,
        masseuse: item.masseuse?.users ? item.masseuse.users as UserInfo : null,
        massage_types: item.massage_types as MassageTypeInfo | null,
      }));

      setBookings(formattedData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
      console.error("Error fetching bookings:", err);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const renderItem = (item: Booking) => {
    const clientName = item.customer ? `${item.customer.first_name ?? ''} ${item.customer.last_name ?? ''}`.trim() : 'N/A';
    const masseuseName = item.masseuse ? `${item.masseuse.first_name ?? ''} ${item.masseuse.last_name ?? ''}`.trim() : 'N/A';
    const scheduledTime = item.scheduled_time ? new Date(item.scheduled_time).toLocaleString() : 'N/A';

    return (
        <ListItemContainer key={item.id}>
            <TextItem>Client: {clientName || 'N/A'}</TextItem>
            <TextItem>Masseuse: {masseuseName || 'N/A'}</TextItem>
            <TextItem>Service: {item.massage_types?.name || 'N/A'}</TextItem>
            <TextItem>When: {scheduledTime}</TextItem>
            <TextItem>Duration: {item.duration_minutes ?? 'N/A'} min</TextItem>
            <TextItem>Status: {item.status || 'N/A'}</TextItem>
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
      <button onClick={() => fetchBookings(false)} style={{ marginBottom: '10px' }}>Refresh Bookings</button>
      {bookings.length === 0
        ? <CenteredText>No bookings found.</CenteredText>
        : bookings.map(renderItem)
      }
    </div>
  );
}

export default BookingsTab; 