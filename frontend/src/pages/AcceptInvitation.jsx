import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitationData, setInvitationData] = useState(null);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token d\'invitation manquant');
      setLoading(false);
      return;
    }

    // Récupérer les données de l'invitation
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await axios.get(`/api/invitations/${token}`);
      setInvitationData(response.data);
      setShowForm(true);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invitation invalide ou expirée');
      setLoading(false);
    }
  };

  const handleRegisterAndAccept = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Créer le compte
      await axios.post('/api/auth/register', {
        email: invitationData.email,
        password: password,
        username: username
      });

      // 2. Accepter l'invitation
      const acceptResponse = await axios.post(`/api/invitations/${token}/accept`);

      // 3. Rediriger vers le workspace
      setTimeout(() => {
        navigate(`/workspaces/${acceptResponse.data.workspace_id}`);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'acceptation de l\'invitation');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p>Chargement de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center', padding: '40px', border: '1px solid #e74c3c', borderRadius: '8px', backgroundColor: '#fadbd8' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2>Invitation invalide</h2>
          <p style={{ color: '#c0392b', marginBottom: '20px' }}>{error}</p>
          <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (!showForm || !invitationData) {
    return null;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '450px', width: '100%', backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#3498db', marginBottom: '10px' }}>🎯 Bienvenue!</h1>
          <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>Créez votre compte pour rejoindre le workspace</p>
          <div style={{ fontSize: '20px', color: '#2c3e50', fontWeight: 'bold', padding: '10px', backgroundColor: '#ecf0f1', borderRadius: '4px' }}>
            {invitationData.workspace_name}
          </div>
        </div>

        <form onSubmit={handleRegisterAndAccept}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>Email</label>
            <input
              type="email"
              value={invitationData.email}
              disabled
              style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px', backgroundColor: '#ecf0f1', cursor: 'not-allowed' }}
            />
            <small style={{ color: '#7f8c8d' }}>Vous pouvez't changer d'email</small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre nom d'utilisateur"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez un mot de passe sécurisé"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: submitting ? '#95a5a6' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {submitting ? '⏳ Création en cours...' : '✓ Créer le compte et accepter'}
          </button>

          <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '12px', marginTop: '20px' }}>
            Invité par: <strong>{invitationData.invited_by}</strong>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitation;
