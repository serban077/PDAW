// frontend/src/components/QRScanner.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './QRScanner.css';

// Icon components
const Icons = {
  Scan: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
      <path d="M7 8h10"></path>
      <path d="M7 12h10"></path>
      <path d="M7 16h10"></path>
    </svg>
  ),
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  XCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  )
};

const QRScanner = ({ onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Load recent scans from localStorage
    const saved = localStorage.getItem('recentScans');
    if (saved) {
      try {
        setRecentScans(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent scans:', e);
      }
    }

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
      
      // Start QR code scanning
      startQRDetection();
      
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Nu s-a putut accesa camera. Verificați permisiunile.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scannerRef.current) {
      clearInterval(scannerRef.current);
      scannerRef.current = null;
    }
    
    setIsScanning(false);
  };

  const startQRDetection = () => {
    // Simple QR detection using canvas
    // In a real app, you'd use a library like jsQR or ZXing
    scannerRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // For demo purposes, we'll simulate QR detection
        // In reality, you'd use jsQR here
        // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        // const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        // if (code) {
        //   handleQRCodeDetected(code.data);
        // }
      }
    }, 100);
  };

  const handleQRCodeDetected = (qrData) => {
    stopScanning();
    processScan(qrData);
  };

  const handleManualScan = () => {
    if (!manualCode.trim()) {
      setError('Introduceți un cod QR valid');
      return;
    }
    
    processScan(manualCode.trim());
    setManualCode('');
  };

  const processScan = async (qrData) => {
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/gym/scan',
        { qrCode: qrData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const result = {
          success: true,
          action: response.data.action,
          message: response.data.message,
          user: response.data.user,
          timestamp: new Date().toISOString()
        };
        
        setScanResult(result);
        addToRecentScans(result);
      } else {
        throw new Error(response.data.message || 'Eroare la scanarea codului QR');
      }
    } catch (err) {
      console.error('Error processing scan:', err);
      const errorResult = {
        success: false,
        message: err.response?.data?.message || err.message || 'Eroare la procesarea scanării',
        user: err.response?.data?.user || null,
        timestamp: new Date().toISOString()
      };
      
      setScanResult(errorResult);
      addToRecentScans(errorResult);
    } finally {
      setLoading(false);
    }
  };

  const addToRecentScans = (result) => {
    const newScans = [result, ...recentScans.slice(0, 9)]; // Keep last 10
    setRecentScans(newScans);
    localStorage.setItem('recentScans', JSON.stringify(newScans));
  };

  const clearResult = () => {
    setScanResult(null);
    setError(null);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="qr-scanner-container">
      {/* Header */}
      <div className="scanner-header">
        <button className="back-button" onClick={onBack}>
          <Icons.ArrowLeft />
          <span>Înapoi</span>
        </button>
        <h1>📱 Scanner QR - Intrări Sală</h1>
      </div>

      <div className="scanner-content">
        {/* Camera Section */}
        <div className="camera-section">
          <div className="camera-container">
            {isScanning ? (
              <div className="video-container">
                <video 
                  ref={videoRef} 
                  className="camera-video"
                  playsInline
                  muted
                />
                <div className="scan-overlay">
                  <div className="scan-frame"></div>
                  <p>Poziționați codul QR în cadru</p>
                </div>
              </div>
            ) : (
              <div className="camera-placeholder">
                <Icons.Camera />
                <p>Apăsați pentru a porni camera</p>
              </div>
            )}
            
            <div className="camera-controls">
              {isScanning ? (
                <button className="control-button stop" onClick={stopScanning}>
                  Oprește Scanarea
                </button>
              ) : (
                <button className="control-button start" onClick={startScanning}>
                  <Icons.Scan />
                  Pornește Scanarea
                </button>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="manual-input-section">
            <h3>🔤 Introducere Manuală</h3>
            <div className="manual-input">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Introduceți codul QR manual..."
                disabled={loading}
              />
              <button 
                onClick={handleManualScan}
                disabled={loading || !manualCode.trim()}
                className="scan-manual-button"
              >
                {loading ? 'Se procesează...' : 'Scanează'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="results-section">
          {/* Current Result */}
          {scanResult && (
            <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
              <div className="result-header">
                <div className="result-icon">
                  {scanResult.success ? <Icons.CheckCircle /> : <Icons.XCircle />}
                </div>
                <button className="close-result" onClick={clearResult}>×</button>
              </div>
              
              <div className="result-content">
                <h3>{scanResult.success ? 'Succes!' : 'Eroare!'}</h3>
                <p className="result-message">{scanResult.message}</p>
                
                {scanResult.user && (
                  <div className="user-info">
                    <Icons.User />
                    <div>
                      <strong>{scanResult.user.name}</strong>
                      {scanResult.user.duration && (
                        <span className="duration">Timp în sală: {scanResult.user.duration} min</span>
                      )}
                      {scanResult.user.subscription && (
                        <span className="subscription">Plan: {scanResult.user.subscription}</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="result-time">
                  {formatTime(scanResult.timestamp)}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <Icons.XCircle />
              <p>{error}</p>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <div className="recent-scans">
              <h3>📋 Scanări Recente</h3>
              <div className="recent-list">
                {recentScans.map((scan, index) => (
                  <div key={index} className={`recent-item ${scan.success ? 'success' : 'error'}`}>
                    <div className="recent-icon">
                      {scan.success ? <Icons.CheckCircle /> : <Icons.XCircle />}
                    </div>
                    <div className="recent-content">
                      <div className="recent-message">{scan.message}</div>
                      {scan.user && (
                        <div className="recent-user">{scan.user.name}</div>
                      )}
                      <div className="recent-time">{formatTime(scan.timestamp)}</div>
                    </div>
                    <div className={`recent-action ${scan.action || 'error'}`}>
                      {scan.action === 'entry' ? 'INTRARE' : 
                       scan.action === 'exit' ? 'IEȘIRE' : 'EROARE'}
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                className="clear-history"
                onClick={() => {
                  setRecentScans([]);
                  localStorage.removeItem('recentScans');
                }}
              >
                Șterge Istoricul
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>📖 Instrucțiuni</h3>
        <ul>
          <li>Porniți camera și îndreptați-o către codul QR al clientului</li>
          <li>Codul va fi scanat automat când este detectat</li>
          <li>Alternativ, introduceți manual codul QR în câmpul de text</li>
          <li>Sistemul va înregistra automat intrarea sau ieșirea clientului</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;