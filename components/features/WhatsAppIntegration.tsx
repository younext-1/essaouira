'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import styles from './WhatsAppIntegration.module.css';

// Type definitions for component states
type ConnectionStatus = 'disconnected' | 'initializing' | 'waiting_qr' | 'connected';

interface WhatsAppIntegrationProps {
  /**
   * The logged-in user's ID from your platform's database.
   * Crucial for context-isolation on the backend.
   */
  userId: string;
  /**
   * Base URL of your separate VPS backend running Baileys + Socket.io.
   */
  backendUrl?: string; 
}

export default function WhatsAppIntegration({ 
  userId, 
  // Default to localhost:3000 to match the user's running backend
  backendUrl = process.env.NEXT_PUBLIC_WA_BACKEND_URL || 'http://localhost:3000' 
}: WhatsAppIntegrationProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // 1. Initial Status Check
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/session/status/${userId}`);
        const data = await response.json();
        
        // The backend returns { success: true, session: { status: '...' } }
        if (data.session && data.session.status) {
          setStatus(data.session.status);
        } else if (!data.success) {
          // If no session exists (404), ensure status is disconnected
          setStatus('disconnected');
        }
      } catch (error) {
        console.error('Failed to fetch WhatsApp status:', error);
      }
    };

    if (userId) {
      fetchStatus();
    }
  }, [userId, backendUrl]);

  // 2. Socket.io Real-time Integration
  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection to VPS Backend
    const socket = io(backendUrl, {
      transports: ['websocket'],
      auth: { userId } // Optional: backend can verify connection based on this auth object
    });

    socketRef.current = socket;

    // We dynamically listen to events suffixed by this userId, ensuring context isolation.
    // e.g. 'qr:user123', 'connected:user123'
    
    socket.on('connect', () => {
      console.log('Socket connected to WA backend for real-time updates.');
    });

    // Received QR Code
    socket.on(`qr:${userId}`, (payload: { userId: string, qr: string }) => {
      // The backend emits an object containing { userId, qr }
      setQrCode(payload.qr);
      setStatus('waiting_qr');
    });

    // Session has been fully established
    socket.on(`connected:${userId}`, () => {
      setStatus('connected');
      setQrCode(null);
      setIsLoading(false);
    });

    // Session was logged out or disconnected
    socket.on(`disconnected:${userId}`, () => {
      setStatus('disconnected');
      setQrCode(null);
      setIsLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, backendUrl]);

  // 3. API Integrations: Start Session
  const startSession = async () => {
    setIsLoading(true);
    setStatus('initializing');
    
    try {
      await fetch(`${backendUrl}/api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      // At this point, the backend starts Baileys and will eventually 
      // fire `qr:${userId}` via socket.io.
    } catch (error) {
      console.error('Failed to start session:', error);
      setStatus('disconnected');
      setIsLoading(false);
    }
  };

  // 3. API Integrations: Stop Session
  const stopSession = async () => {
    setIsLoading(true);
    try {
      await fetch(`${backendUrl}/api/session/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deleteAuthData: true }),
      });
      // The disconnected status might come via socket event `disconnected:${userId}`,
      // but we update it here optimistically just in case.
      setStatus('disconnected');
    } catch (error) {
      console.error('Failed to stop session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // UI Helpers
  const getStatusLabel = () => {
    switch (status) {
      case 'disconnected': return 'Disconnected';
      case 'initializing': return 'Initializing Engine...';
      case 'waiting_qr': return 'Waiting for Scan';
      case 'connected': return 'Connected Securely';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className={styles.title}>WhatsApp Automation</h2>
          <p className={styles.subtitle}>Link your device to unlock automated vendor interactions and real-time alerts.</p>
        </motion.div>

        <div className={`${styles.statusBadge} ${styles[status]}`}>
          <span className={styles.statusDot}></span>
          {getStatusLabel()}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* DISCONNECTED STATE */}
        {status === 'disconnected' && (
          <motion.div
            key="disconnected"
            className={styles.colCenter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <button 
              className={styles.primaryButton} 
              onClick={startSession}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className={`${styles.icon} ${styles.spin}`} />
              ) : (
                <Smartphone className={styles.icon} />
              )}
              <span>{isLoading ? 'Connecting Engine...' : 'Connect WhatsApp'}</span>
            </button>
          </motion.div>
        )}

        {/* INITIALIZING / WAITING QR STATE */}
        {(status === 'initializing' || status === 'waiting_qr') && (
          <motion.div
            key="qr"
            className={styles.colCenter}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.qrContainer}>
              {status === 'waiting_qr' && qrCode ? (
                <img src={qrCode} alt="WhatsApp QR Code" className={styles.qrImage} />
              ) : (
                <div className={styles.skeletonQr}></div>
              )}
            </div>
            {status === 'waiting_qr' && (
              <p className={styles.instructionText}>
                Open WhatsApp on your phone, tap <strong>Linked Devices</strong>, and scan this QR code to connect your account.
              </p>
            )}
          </motion.div>
        )}

        {/* CONNECTED STATE */}
        {status === 'connected' && (
          <motion.div
            key="connected"
            className={styles.colCenter}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.connectedIconContainer}>
              <CheckCircle2 className={styles.connectedIcon} />
            </div>
            
            <button 
              className={styles.dangerButton} 
              onClick={stopSession}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className={`${styles.icon} ${styles.spin}`} />
              ) : (
                <LogOut className={styles.icon} />
              )}
              <span>Disconnect Device</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
