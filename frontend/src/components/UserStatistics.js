// frontend/src/components/UserStatistics.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserStatistics.css';

// Icon components
const Icons = {
  TrendingUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Award: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  ),
  Target: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  QrCode: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="5"></rect>
      <rect x="3" y="16" width="5" height="5"></rect>
      <rect x="16" y="3" width="5" height="5"></rect>
      <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
      <path d="M21 21v.01"></path>
      <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
      <path d="M3 12h.01"></path>
      <path d="M12 3h.01"></path>
      <path d="M12 16v.01"></path>
      <path d="M16 12h1"></path>
      <path d="M21 12v.01"></path>
      <path d="M12 21v-1"></path>
    </svg>
  ),
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  )
};

const UserStatistics = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserStats();
    if (activeTab === 'history') {
      fetchUserHistory();
    } else if (activeTab === 'qr') {
      fetchQRCode();
    }
  }, [activeTab]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/gym/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      setError('Eroare la încărcarea statisticilor');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/gym/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setHistory(response.data.entries);
      }
    } catch (err) {
      setError('Eroare la încărcarea istoricului');
      console.error('Error fetching history:', err);
    }
  };

  const fetchQRCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/gym/qr-code', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setQrCode(response.data);
      }
    } catch (err) {
      setError('Eroare la generarea codului QR');
      console.error('Error fetching QR code:', err);
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

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDayName = (dayIndex) => {
    const days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
    return days[dayIndex] || 'Necunoscut';
  };

  const getTimeSlotName = (slot) => {
    const slots = {
      'morning': 'Dimineața',
      'afternoon': 'Prânz',
      'evening': 'Seara',
      'night': 'Noaptea'
    };
    return slots[slot] || slot;
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă statisticile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="statistics-header">
        <button className="back-button" onClick={onBack}>
          <Icons.ArrowLeft />
          <span>Înapoi</span>
        </button>
        <h1>📊 Statisticile Mele</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="statistics-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Icons.TrendingUp />
          <span>Prezentare</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Icons.Calendar />
          <span>Istoric</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'qr' ? 'active' : ''}`}
          onClick={() => setActiveTab('qr')}
        >
          <Icons.QrCode />
          <span>Codul Meu QR</span>
        </button>
      </div>

      {/* Content */}
      <div className="statistics-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {activeTab === 'overview' && stats && (
          <div className="overview-tab">
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Icons.Target />
                </div>
                <div className="stat-info">
                  <h3>{stats.total_entries || 0}</h3>
                  <p>Total Intrări</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Icons.Calendar />
                </div>
                <div className="stat-info">
                  <h3>{stats.current_month_entries || 0}</h3>
                  <p>Luna Curentă</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Icons.Clock />
                </div>
                <div className="stat-info">
                  <h3>{formatDuration(stats.average_duration)}</h3>
                  <p>Timp Mediu</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Icons.Award />
                </div>
                <div className="stat-info">
                  <h3>{formatDuration(stats.longest_session)}</h3>
                  <p>Cea Mai Lungă Ședință</p>
                </div>
              </div>
            </div>

            {/* Charts and Additional Stats */}
            <div className="charts-section">
              <div className="chart-card">
                <h3>📅 Activitate Săptămânală</h3>
                {stats.weekly_stats && stats.weekly_stats.length > 0 ? (
                  <div className="weekly-chart">
                    {stats.weekly_stats.map((day, index) => (
                      <div key={index} className="day-bar">
                        <div className="day-name">{getDayName(day.day_of_week)}</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ 
                              height: `${Math.max((day.entries_count / Math.max(...stats.weekly_stats.map(d => d.entries_count))) * 100, 5)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="day-count">{day.entries_count}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Nu există date pentru această săptămână</p>
                )}
              </div>

              <div className="chart-card">
                <h3>🕐 Timpul Preferat</h3>
                <div className="favorite-time">
                  <div className="time-slot-badge">
                    {getTimeSlotName(stats.favorite_time_slot)}
                  </div>
                  <p>Majoritatea intrărilor tale sunt {getTimeSlotName(stats.favorite_time_slot).toLowerCase()}</p>
                </div>
              </div>
            </div>

            {/* Recent Entries */}
            {stats.recent_entries && stats.recent_entries.length > 0 && (
              <div className="recent-entries">
                <h3>🔄 Intrări Recente</h3>
                <div className="entries-list">
                  {stats.recent_entries.slice(0, 5).map((entry, index) => (
                    <div key={index} className="entry-item">
                      <div className="entry-time">
                        {formatDate(entry.entry_time)}
                      </div>
                      <div className="entry-duration">
                        {entry.duration_minutes ? formatDuration(entry.duration_minutes) : 'În curs...'}
                      </div>
                      <div className={`entry-status ${entry.status}`}>
                        {entry.status === 'active' ? 'În sală' : 'Completată'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <h3>📋 Istoric Complet</h3>
            {history.length > 0 ? (
              <div className="history-list">
                {history.map((entry, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">
                      <div className="date-primary">{formatDate(entry.entry_time)}</div>
                      {entry.exit_time && (
                        <div className="date-secondary">Ieșire: {formatDate(entry.exit_time)}</div>
                      )}
                    </div>
                    <div className="history-details">
                      <div className="duration">
                        <Icons.Clock />
                        <span>{formatDuration(entry.duration_minutes)}</span>
                      </div>
                      <div className="method">
                        Metodă: {entry.entry_method === 'qr_scan' ? 'QR Scan' : entry.entry_method}
                      </div>
                    </div>
                    <div className={`history-status ${entry.status}`}>
                      {entry.status === 'active' ? 'În sală' : 'Completată'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <Icons.Calendar />
                <p>Nu există intrări în istoric</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="qr-tab">
            <h3>📱 Codul Tău QR pentru Intrarea în Sală</h3>
            <div className="qr-section">
              {qrCode ? (
                <div className="qr-container">
                  <div className="qr-code-display">
                    <img src={qrCode.qrCodeUrl} alt="Cod QR pentru intrare" />
                  </div>
                  <div className="qr-info">
                    <h4>Cum să folosești codul QR:</h4>
                    <ol>
                      <li>Prezintă acest cod la intrarea în sală</li>
                      <li>Scanează codul cu scanerul de la recepție</li>
                      <li>Codul va înregistra automat intrarea/ieșirea</li>
                    </ol>
                    <div className="qr-code-text">
                      <strong>Cod:</strong> {qrCode.qrCode}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="qr-loading">
                  <div className="spinner"></div>
                  <p>Se generează codul QR...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStatistics;