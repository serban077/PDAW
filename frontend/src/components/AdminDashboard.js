// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import '../AuthForm.css';
import './AdminDashboard.css';

// Icon components
const Icons = {
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  CreditCard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  BarChart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"></line>
      <line x1="18" y1="20" x2="18" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="M21 21l-4.35-4.35"></path>
    </svg>
  ),
  Ban: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  )
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  
  const { logout } = useAuth();

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch users
  const fetchUsers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10, search }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.totalPages);
        setCurrentPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Eroare la încărcarea utilizatorilor');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscriptions
  const fetchSubscriptions = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10, search }
      });
      
      if (response.data.success) {
        setSubscriptions(response.data.subscriptions);
        setTotalPages(response.data.pagination.totalPages);
        setCurrentPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setMessage('Eroare la încărcarea abonamentelor');
    } finally {
      setLoading(false);
    }
  };

  // Ban user
  const handleBanUser = async (userId, username) => {
    if (!window.confirm(`Sigur doriți să banați utilizatorul ${username}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const reason = prompt('Motivul ban-ului (opțional):') || 'Încălcarea regulamentului';
      
      const response = await axios.post(
        `http://localhost:5000/api/admin/users/${userId}/ban`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setMessage(`Utilizatorul ${username} a fost banat cu succes`);
        fetchUsers(currentPage, searchTerm);
      }
    } catch (error) {
      console.error('Error banning user:', error);
      setMessage(error.response?.data?.message || 'Eroare la banarea utilizatorului');
    }
  };

  // Unban user
  const handleUnbanUser = async (userId, username) => {
    if (!window.confirm(`Sigur doriți să debanați utilizatorul ${username}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/admin/users/${userId}/unban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setMessage(`Utilizatorul ${username} a fost debanat cu succes`);
        fetchUsers(currentPage, searchTerm);
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      setMessage(error.response?.data?.message || 'Eroare la debanarea utilizatorului');
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    if (activeTab === 'users') {
      fetchUsers(1, searchTerm);
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions(1, searchTerm);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load initial data
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1, searchTerm);
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions(1, searchTerm);
    }
  }, [activeTab, searchTerm]); // Adaugă searchTerm în dependency array

  // Dashboard tab component
  const DashboardTab = () => (
    <div className="admin-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <Icons.Users />
          </div>
          <div className="stat-info">
            <h3>{stats.totalUsers || 0}</h3>
            <p>Utilizatori Activi</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon subscriptions">
            <Icons.CreditCard />
          </div>
          <div className="stat-info">
            <h3>{stats.activeSubscriptions || 0}</h3>
            <p>Abonamente Active</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon revenue">
            <Icons.BarChart />
          </div>
          <div className="stat-info">
            <h3>{stats.monthlyRevenue || 0} RON</h3>
            <p>Venituri Luna Curentă</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon banned">
            <Icons.Shield />
          </div>
          <div className="stat-info">
            <h3>{stats.bannedUsers || 0}</h3>
            <p>Utilizatori Banați</p>
          </div>
        </div>
      </div>

      {stats.topPlans && stats.topPlans.length > 0 && (
        <div className="chart-section">
          <h3>Top Planuri de Abonament</h3>
          <div className="plans-chart">
            {stats.topPlans.map((plan, index) => (
              <div key={index} className="plan-bar">
                <div className="plan-name">{plan.name}</div>
                <div className="plan-stats">
                  <span>{plan.subscriptions_count} abonamente</span>
                  <span>{plan.total_revenue || 0} RON</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Users tab component
  const UsersTab = () => (
    <div className="admin-content">
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <Icons.Search />
            <input
              type="text"
              placeholder="Caută utilizatori (nume, email, username)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="search-btn">
            Caută
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă...</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Utilizator</th>
                <th>Email</th>
                <th>Abonamente</th>
                <th>Status</th>
                <th>Înregistrat</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <div className="user-info">
                      <strong>{user.first_name} {user.last_name}</strong>
                      <small>@{user.username}</small>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <div className="subscription-info">
                      <span className="total">{user.total_subscriptions} total</span>
                      <span className="active">{user.active_subscriptions} active</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.role}`}>
                      {user.role === 'banned' ? 'Banat' : 'Activ'}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      {user.role === 'banned' ? (
                        <button
                          className="btn-unban"
                          onClick={() => handleUnbanUser(user.id, user.username)}
                          title="Debanează utilizatorul"
                        >
                          <Icons.CheckCircle />
                        </button>
                      ) : (
                        <button
                          className="btn-ban"
                          onClick={() => handleBanUser(user.id, user.username)}
                          title="Banează utilizatorul"
                        >
                          <Icons.Ban />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => fetchUsers(currentPage - 1, searchTerm)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                Anterior
              </button>
              <span className="page-info">
                Pagina {currentPage} din {totalPages}
              </span>
              <button
                onClick={() => fetchUsers(currentPage + 1, searchTerm)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Următor
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Subscriptions tab component
  const SubscriptionsTab = () => (
    <div className="admin-content">
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <Icons.Search />
            <input
              type="text"
              placeholder="Caută abonamente (utilizator, plan)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="search-btn">
            Caută
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă...</p>
        </div>
      ) : (
        <div className="subscriptions-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Utilizator</th>
                <th>Plan</th>
                <th>Preț</th>
                <th>Perioada</th>
                <th>Status</th>
                <th>Plată</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.id}</td>
                  <td>
                    <div className="user-info">
                      <strong>{sub.first_name} {sub.last_name}</strong>
                      <small>@{sub.username}</small>
                    </div>
                  </td>
                  <td>{sub.plan_name}</td>
                  <td>{sub.price} RON</td>
                  <td>
                    <div className="period-info">
                      <div>{formatDate(sub.start_date)}</div>
                      <div>{formatDate(sub.end_date)}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${sub.status}`}>
                      {sub.status === 'active' ? 'Activ' : 
                       sub.status === 'expired' ? 'Expirat' : 
                       sub.status === 'cancelled' ? 'Anulat' : sub.status}
                    </span>
                  </td>
                  <td>
                    {sub.paid_amount && (
                      <div className="payment-info">
                        <div>{sub.paid_amount} RON</div>
                        <small>{sub.payment_method}</small>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => fetchSubscriptions(currentPage - 1, searchTerm)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                Anterior
              </button>
              <span className="page-info">
                Pagina {currentPage} din {totalPages}
              </span>
              <button
                onClick={() => fetchSubscriptions(currentPage + 1, searchTerm)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Următor
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h1>🏋️♂️ Admin Dashboard - UNILUX FITNESS</h1>
        </div>
        <div className="header-right">
          <button onClick={logout} className="logout-btn">
            <Icons.LogOut />
            Deconectare
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="admin-nav">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Icons.BarChart />
          Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Icons.Users />
          Utilizatori
        </button>
        <button
          className={`nav-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <Icons.CreditCard />
          Abonamente
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="admin-message">
          <p>{message}</p>
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      {/* Content */}
      <div className="admin-main">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;