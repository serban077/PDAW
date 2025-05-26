// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import '../AuthForm.css';
import './AdminDashboard.css';

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
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  
  const { logout } = useAuth();

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

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setMessage('Eroare la încărcarea planurilor');
    }
  };

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

  const handleChangeUserSubscription = async (userId, newPlanId, username) => {
    if (!window.confirm(`Sigur doriți să schimbați abonamentul pentru ${username}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/admin/users/${userId}/change-subscription`,
        { planId: newPlanId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setMessage(`Abonamentul pentru ${username} a fost schimbat cu succes`);
        fetchUsers(currentPage, searchTerm);
      }
    } catch (error) {
      console.error('Error changing subscription:', error);
      setMessage(error.response?.data?.message || 'Eroare la schimbarea abonamentului');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    if (activeTab === 'users') {
      fetchUsers(1, searchTerm);
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions(1, searchTerm);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchStats();
    fetchPlans();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1, searchTerm);
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions(1, searchTerm);
    }
  }, [activeTab, searchTerm]);

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
                    <div className="subscription-management">
                      <select 
                        className="subscription-select"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleChangeUserSubscription(user.id, e.target.value, user.username);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">Schimbă abonament</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {plan.price} RON
                          </option>
                        ))}
                      </select>
                    </div>
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

  const PlansTab = () => {
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({
      name: '',
      description: '',
      price: '',
      duration_days: 30,
      features: [''],
      active: true
    });

    const handlePlanFormChange = (field, value) => {
      setPlanForm(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleFeatureChange = (index, value) => {
      const newFeatures = [...planForm.features];
      newFeatures[index] = value;
      setPlanForm(prev => ({
        ...prev,
        features: newFeatures
      }));
    };

    const addFeature = () => {
      setPlanForm(prev => ({
        ...prev,
        features: [...prev.features, '']
      }));
    };

    const removeFeature = (index) => {
      const newFeatures = planForm.features.filter((_, i) => i !== index);
      setPlanForm(prev => ({
        ...prev,
        features: newFeatures
      }));
    };

    const handleCreatePlan = async (planData) => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:5000/api/admin/plans',
          planData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setMessage('Planul a fost creat cu succes');
          fetchPlans();
          return true;
        }
      } catch (error) {
        console.error('Error creating plan:', error);
        setMessage(error.response?.data?.message || 'Eroare la crearea planului');
        return false;
      }
    };

    const handleUpdatePlan = async (planId, planData) => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.put(
          `http://localhost:5000/api/admin/plans/${planId}`,
          planData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setMessage('Planul a fost actualizat cu succes');
          fetchPlans();
          return true;
        }
      } catch (error) {
        console.error('Error updating plan:', error);
        setMessage(error.response?.data?.message || 'Eroare la actualizarea planului');
        return false;
      }
    };

    const handleDeletePlan = async (planId, planName) => {
      if (!window.confirm(`Sigur doriți să ștergeți planul "${planName}"?`)) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `http://localhost:5000/api/admin/plans/${planId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setMessage('Planul a fost șters cu succes');
          fetchPlans();
        }
      } catch (error) {
        console.error('Error deleting plan:', error);
        setMessage(error.response?.data?.message || 'Eroare la ștergerea planului');
      }
    };

    const handleSubmitPlan = async (e) => {
      e.preventDefault();
      
      const planData = {
        ...planForm,
        price: parseFloat(planForm.price),
        features: planForm.features.filter(f => f.trim() !== '')
      };

      let success = false;
      if (editingPlan) {
        success = await handleUpdatePlan(editingPlan.id, planData);
      } else {
        success = await handleCreatePlan(planData);
      }

      if (success) {
        setShowPlanForm(false);
        setEditingPlan(null);
        setPlanForm({
          name: '',
          description: '',
          price: '',
          duration_days: 30,
          features: [''],
          active: true
        });
      }
    };

    const startEditPlan = (plan) => {
      const features = typeof plan.features === 'string' 
        ? JSON.parse(plan.features) 
        : plan.features || [''];
      
      setPlanForm({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price?.toString() || '',
        duration_days: plan.duration_days || 30,
        features: features.length > 0 ? features : [''],
        active: plan.active !== false
      });
      setEditingPlan(plan);
      setShowPlanForm(true);
    };

    const cancelEdit = () => {
      setShowPlanForm(false);
      setEditingPlan(null);
      setPlanForm({
        name: '',
        description: '',
        price: '',
        duration_days: 30,
        features: [''],
        active: true
      });
    };

    return (
      <div className="admin-content">
        <div className="plans-header">
          <h2>Gestionare Planuri de Abonament</h2>
          <button 
            className="search-btn"
            onClick={() => setShowPlanForm(true)}
          >
            + Adaugă Plan Nou
          </button>
        </div>

        {showPlanForm && (
          <div className="plan-form-modal">
            <div className="plan-form-content">
              <h3>{editingPlan ? 'Editează Plan' : 'Adaugă Plan Nou'}</h3>
              <form onSubmit={handleSubmitPlan}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nume Plan</label>
                    <input
                      type="text"
                      value={planForm.name}
                      onChange={(e) => handlePlanFormChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Preț (RON)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.price}
                      onChange={(e) => handlePlanFormChange('price', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Durată (zile)</label>
                    <input
                      type="number"
                      value={planForm.duration_days}
                      onChange={(e) => handlePlanFormChange('duration_days', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={planForm.active}
                      onChange={(e) => handlePlanFormChange('active', e.target.value === 'true')}
                    >
                      <option value="true">Activ</option>
                      <option value="false">Inactiv</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descriere</label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => handlePlanFormChange('description', e.target.value)}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Caracteristici</label>
                  {planForm.features.map((feature, index) => (
                    <div key={index} className="feature-input-row">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder="Introduceți o caracteristică"
                      />
                      {planForm.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="remove-feature-btn"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="add-feature-btn"
                  >
                    + Adaugă Caracteristică
                  </button>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={cancelEdit} className="cancel-btn">
                    Anulează
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingPlan ? 'Actualizează' : 'Creează'} Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="plans-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nume</th>
                <th>Preț</th>
                <th>Durată</th>
                <th>Status</th>
                <th>Caracteristici</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td>{plan.id}</td>
                  <td>
                    <div>
                      <strong>{plan.name}</strong>
                      {plan.description && <small>{plan.description}</small>}
                    </div>
                  </td>
                  <td>{plan.price} RON</td>
                  <td>{plan.duration_days} zile</td>
                  <td>
                    <span className={`status-badge ${plan.active ? 'active' : 'inactive'}`}>
                      {plan.active ? 'Activ' : 'Inactiv'}
                    </span>
                  </td>
                  <td>
                    <div className="features-list">
                      {(() => {
                        try {
                          const features = typeof plan.features === 'string' 
                            ? JSON.parse(plan.features) 
                            : plan.features || [];
                          return features.slice(0, 2).map((feature, index) => (
                            <div key={index} className="feature-item">• {feature}</div>
                          ));
                        } catch (e) {
                          return <div>Eroare la afișarea caracteristicilor</div>;
                        }
                      })()}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => startEditPlan(plan)}
                        title="Editează plan"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeletePlan(plan.id, plan.name)}
                        title="Șterge plan"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
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

      <div className="admin-nav">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Icons.BarChart />
          Dashboard
        </button>

        <button
          className={`nav-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <Icons.CreditCard />
          Planuri
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

      {message && (
        <div className="admin-message">
          <p>{message}</p>
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="admin-main">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'plans' && <PlansTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;