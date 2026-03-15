import React, { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FaInbox, FaChevronLeft, FaCircle } from 'react-icons/fa';  // FaPlus removed
import SupportService from '../services/SupportService';
import '../styles/PayPalStyles.css';
import Footer from '../components/common/Footer';

const SupportCenterPage = () => {
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState(null);

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState(null);

  const [newMessage, setNewMessage] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const data = await SupportService.listTickets();
      const normalized = Array.isArray(data) ? data.map(t => ({
        ticketId: t.ticketId || t.ticket_id || t.ticket_uuid,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        lastActivityAt: t.lastActivityAt || t.last_activity_at || t.updatedAt || t.updated_at,
        createdAt: t.createdAt || t.created_at,
        summary: t.description || '',
        unreadCount: t.unreadCount || 0,
      })) : [];
      setTickets(normalized);
      if (!selectedTicketId && normalized.length > 0) {
        setSelectedTicketId(normalized[0].ticketId);
      }
    } catch (err) {

      setTicketsError('Failed to load tickets');
    } finally {
      setTicketsLoading(false);
    }
  }, [selectedTicketId]);

  const loadTicketDetails = useCallback(async (ticketId) => {
    if (!ticketId) {
      setSelectedTicket(null);
      return;
    }
    setTicketLoading(true);
    setTicketError(null);
    try {
      const t = await SupportService.getTicket(ticketId);
      const normalized = {
        ticketId: t.ticketId || t.ticket_id || t.ticket_uuid,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        paymentId: t.paymentId || t.payment_id || t.payment_uuid,
        coinPurchaseId: t.coinPurchaseId || t.coin_purchase_id || t.coin_purchase_uuid,
        amountCents: t.amountCents != null ? t.amountCents : t.amount_cents,
        currency: t.currency || 'USD',
        coinsAmount: t.coinsAmount != null ? t.coinsAmount : t.coins_amount,
        assignedAdminId: t.assignedAdminId,
        messages: Array.isArray(t.messages) ? t.messages.map(m => ({
          messageId: m.messageId || m.message_id,
          responderUserId: m.responderUserId || m.responder_user_id,
          internal: !!m.internal,
          body: m.body,
          attachments: m.attachments,
          createdAt: m.createdAt || m.created_at
        })) : []
      };
      setSelectedTicket(normalized);
    } catch (err) {

      setTicketError('Failed to load ticket details');
    } finally {
      setTicketLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (selectedTicketId) loadTicketDetails(selectedTicketId);
  }, [selectedTicketId, loadTicketDetails]);

  const handleSelectTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
  };

  const submitMessage = async () => {
    if (!selectedTicketId) return;
    if (!newMessage.trim()) return;
    setPostingMessage(true);
    try {
      const msg = await SupportService.addMessage(selectedTicketId, { body: newMessage.trim(), attachments: null, internal: false });
      const appended = {
        messageId: msg.messageId || msg.message_id,
        responderUserId: msg.responderUserId || msg.responder_user_id,
        internal: !!msg.internal,
        body: msg.body,
        attachments: msg.attachments,
        createdAt: msg.createdAt || msg.created_at
      };
      setSelectedTicket(prev => prev ? { ...prev, messages: [...(prev.messages || []), appended], lastActivityAt: appended.createdAt } : prev);
      setNewMessage('');
      await loadTickets();
    } catch (err) {

      alert('Failed to send message.');
    } finally {
      setPostingMessage(false);
    }
  };

  const renderStatusBadge = (status) => {
    const map = {
      OPEN: { label: 'Open', className: 'user-status-pending' },
      PENDING: { label: 'Pending', className: 'user-status-pending' },
      RESOLVED: { label: 'Resolved', className: 'user-status-completed' },
      CLOSED: { label: 'Closed', className: 'user-status-failed' },
      DECLINED: { label: 'Declined', className: 'user-status-failed' }
    };
    const s = map[status] || { label: status || 'Unknown', className: '' };
    return <span className={`user-status-badge ${s.className}`}>{s.label}</span>;
  };

  return (
    <div className="user-support-center-page">
      <div className="user-support-header">
        <h2><FaInbox /> Support Center</h2>
        {/* New Ticket button removed */}
      </div>

      <div className="user-support-body">
        <aside className="user-support-sidebar">
          <h3>Your Tickets</h3>
          {ticketsLoading ? (
            <div className="user-loading-indicator">Loading tickets...</div>
          ) : ticketsError ? (
            <div className="user-error-message">{ticketsError}</div>
          ) : tickets.length === 0 ? (
            <div className="user-no-tickets">You have no support tickets.</div>
          ) : (
            <ul className="user-ticket-list">
              {tickets.map(t => (
                <li
                  key={t.ticketId}
                  className={`user-ticket-list-item ${selectedTicketId === t.ticketId ? 'selected' : ''}`}
                  onClick={() => handleSelectTicket(t.ticketId)}
                >
                  <div className="user-ticket-subject">{t.subject || '(no subject)'}</div>
                  <div className="user-ticket-meta">
                    {renderStatusBadge(t.status)}
                    <span className="user-ticket-updated"> • {t.lastActivityAt ? formatDistanceToNow(new Date(t.lastActivityAt), { addSuffix: true }) : ''}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="user-support-main">
          {!selectedTicket ? (
            <div className="user-placeholder">
              <p>Select a ticket to view details and messages.</p>
            </div>
          ) : ticketLoading ? (
            <div className="user-loading-indicator">Loading ticket...</div>
          ) : ticketError ? (
            <div className="user-error-message">{ticketError}</div>
          ) : (
            <div className="user-ticket-detail">
              <div className="user-ticket-top">
                <button className="user-back-btn" onClick={() => setSelectedTicketId(null)}><FaChevronLeft /> Back</button>
                <div className="user-ticket-header">
                  <h3>{selectedTicket.subject}</h3>
                  <div className="user-ticket-meta">
                    {renderStatusBadge(selectedTicket.status)} &nbsp;
                    <span className="user-ticket-priority"><FaCircle style={{ fontSize: 8, marginRight: 6 }} /> {selectedTicket.priority}</span>
                    <span className="user-ticket-updated"> • Last activity {selectedTicket.lastActivityAt ? formatDistanceToNow(new Date(selectedTicket.lastActivityAt), { addSuffix: true }) : ''}</span>
                  </div>
                </div>
              </div>

              <div className="user-ticket-info">
                <div className="user-ticket-description">
                  <strong>Original description:</strong>
                  <p>{selectedTicket.description || '—'}</p>
                </div>
                <div className="user-ticket-links">
                  {selectedTicket.coinPurchaseId && <div>Coin Purchase: {selectedTicket.coinPurchaseId}</div>}
                  {selectedTicket.paymentId && <div>Payment: {selectedTicket.paymentId}</div>}
                  {selectedTicket.amountCents != null && <div>Amount: ${ (selectedTicket.amountCents/100).toFixed(2) } {selectedTicket.currency}</div>}
                </div>
              </div>

              <div className="user-message-thread">
                <h4>Conversation</h4>
                {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                  <div className="user-no-messages">No messages yet.</div>
                ) : (
                  <ul className="user-messages-list">
                    {selectedTicket.messages.map(m => (
                      <li key={m.messageId || Math.random()} className={`user-message-item ${m.internal ? 'internal' : 'user'}`}>
                        <div className="user-message-meta">
                          <span className="user-responder">{m.responderUserId ? (m.responderUserId === 'SYSTEM' ? 'System' : (m.responderUserId || 'You')) : 'You'}</span>
                          <span className="user-message-time"> • {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : ''}</span>
                          {m.internal && <span className="user-internal-badge">internal</span>}
                        </div>
                        <div className="user-message-body">{m.body}</div>
                        {m.attachments && <div className="user-message-attachments">Attachments: {m.attachments}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="user-message-composer">
                <textarea
                  rows={4}
                  placeholder="Write a message to support..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={postingMessage}
                />
                <div className="user-composer-actions">
                  <button className="user-btn" onClick={submitMessage} disabled={postingMessage || !newMessage.trim()}>
                    {postingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default SupportCenterPage;