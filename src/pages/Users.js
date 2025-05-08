import React from 'react';
import { useParams } from 'react-router-dom';

function UserPage() {
  const { id } = useParams();

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome, User ID: {id}</h2>
      <p>This is your personalized dashboard.</p>
    </div>
  );
}

export default UserPage;
