import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Adjust path as needed

// Define interfaces based on expected Supabase query result structure
interface MassageType {
  name: string | null;
}

interface MasseuseMassageType {
  custom_price: number | null; // Based on schema: custom_price
  massage_types: MassageType | null;
}

interface UserInfo {
    first_name: string | null;
    last_name: string | null;
}

interface Masseuse {
  masseuse_id: string; // PK from schema
  bio: string | null;
  rating: number | null;
  is_available: boolean | null;
  users: UserInfo | null; // Joined user data (assuming masseuses.masseuse_id = users.id)
  masseuse_massage_types: MasseuseMassageType[]; // Joined services data
}

// Basic Web Components
const ListItemContainer = ({ children }: { children: React.ReactNode }) => <div style={{ backgroundColor: '#f9f9f9', padding: '15px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #eee' }}>{children}</div>;
const TextItem = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => <p style={{ fontSize: '14px', marginBottom: '5px', ...style }}>{children}</p>;
const CenteredText = ({ children }: { children: React.ReactNode }) => <p style={{ textAlign: 'center', marginTop: '20px' }}>{children}</p>;
const ErrorText = ({ children }: { children: React.ReactNode }) => <p style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>{children}</p>;
const LoadingIndicator = () => <CenteredText>Loading...</CenteredText>;

function MasseusesTab() {
  const [masseuses, setMasseuses] = useState<Masseuse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMasseuses = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('masseuses')
        .select(`
          masseuse_id,
          bio,
          rating,
          is_available,
          users!inner ( first_name, last_name ), 
          masseuse_massage_types ( 
            custom_price, 
            massage_types ( name )
          )
        `);

      if (fetchError) throw fetchError;
      setMasseuses(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch masseuses');
      console.error("Error fetching masseuses:", err);
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasseuses();
  }, [fetchMasseuses]);

  const renderItem = (item: Masseuse) => (
    <ListItemContainer key={item.masseuse_id}>
      <TextItem style={{ fontSize: '16px', fontWeight: 'bold' }}>
        {item.users?.first_name || ''} {item.users?.last_name || 'N/A'}
      </TextItem>
      <TextItem>Bio: {item.bio || 'N/A'}</TextItem>
      <TextItem>Rating: {item.rating?.toFixed(1) ?? 'N/A'}</TextItem>
      <TextItem>Available: {item.is_available === null ? 'Unknown' : item.is_available ? 'Yes' : 'No'}</TextItem>
      <TextItem style={{ fontWeight: 'bold', marginTop: '10px' }}>Services:</TextItem>
      {item.masseuse_massage_types.length > 0 ? (
        item.masseuse_massage_types.map((service, index) => (
          <TextItem key={index} style={{ marginLeft: '15px' }}>
            - {service.massage_types?.name || 'Unknown Service'}: ${service.custom_price?.toFixed(2) ?? 'N/A'}
          </TextItem>
        ))
      ) : (
        <TextItem style={{ marginLeft: '15px' }}>- No services listed.</TextItem>
      )}
    </ListItemContainer>
  );

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorText>Error: {error}</ErrorText>;
  }

  return (
    <div>
      <button onClick={() => fetchMasseuses(false)} style={{ marginBottom: '10px' }}>Refresh Masseuses</button>
      {masseuses.length === 0
        ? <CenteredText>No masseuses found.</CenteredText>
        : masseuses.map(renderItem)
      }
    </div>
  );
}

export default MasseusesTab; 