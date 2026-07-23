import React, { useState } from 'react';
import axios from 'axios';

const InviteMember = ({ workspaceId, onInviteSent }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.post(`/api/workspaces/${workspaceId}/invite`, {
        email,
        role
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setMessage(`✓ Invitation envoyée à ${email}`);
      setEmail('');
      setRole('member');
      
      if (onInviteSent) {
        onInviteSent();
      }

      setTimeout(() => {
        setMessage('');
        setShowForm(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        + Inviter un membre
      </button>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f9f9f9',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e1e8ed',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>Inviter un membre</h3>

      <form onSubmit={handleInvite}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="membre@example.com"
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Rôle
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          >
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fadbd8',
            color: '#c0392b',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        {message && (
          <div style={{
            backgroundColor: '#d5f4e6',
            color: '#27ae60',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: loading ? '#95a5a6' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {loading ? '⏳ Envoi...' : '✓ Envoyer l\'invitation'}
          </button>

          <button
            type="button"
            onClick={() => setShowForm(false)}
            style={{
              padding: '10px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default InviteMember;
