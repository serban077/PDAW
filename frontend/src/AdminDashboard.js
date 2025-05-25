import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AuthForm.css';

const AdminDashboard = ({ onLogout }) => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/users');
        setMembers(data);
        setLoading(false);
      } catch (error) {
        console.error('Eroare la încărcarea membrilor');
        setLoading(false);
      }
    };
    
    fetchMembers();
    const interval = setInterval(fetchMembers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBan = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/ban/${userId}`);
      setMembers(members.map(member => 
        member.id === userId ? {...member, status: member.status === 'active' ? 'banned' : 'active'} : member
      ));
    } catch (error) {
      console.error('Eroare la banare');
    }
  };

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="status-message">Se încarcă...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🏋️♂️ Panou Administrator</h1>
        <button onClick={onLogout} className="auth-button danger">✖ Deconectare</button>
      </header>

      <div className="auth-card">
        <div className="input-group">
          <input
            type="text"
            placeholder="Caută membru..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Utilizator</th>
              <th>Status</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map(member => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.username}</td>
                <td>
                  <span className={`status-badge ${member.status}`}>
                    {member.status === 'banned' ? '⛔ Banat' : '✅ Activ'}
                  </span>
                </td>
                <td>
                  <button
                    className={`auth-button ${member.status === 'banned' ? 'success' : 'danger'}`}
                    onClick={() => handleBan(member.id)}>
                    {member.status === 'banned' ? 'Debanează' : 'Banează'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;