import React, { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FaInbox, FaPlus, FaChevronLeft, FaCircle } from 'react-icons/fa';
import SupportService from '../services/SupportService';
import '../styles/PayPalStyles.css'; // reuse existing styles, tweak as needed

/**
 * SupportCenterPage
 *
 * - Lists user's tickets
 * - Shows selected ticket details & messages
 * - Allows posting a new user message (non-internal)
 */
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
      // normalise field names if backend uses different casing
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
      // auto-select first ticket if none selected
      if (!selectedTicketId && normalized.length > 0) {
        setSelectedTicketId(normalized[0].ticketId);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
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
      // backend returns messages filtered (internal etc) according to current user permissions
      // normalize common fields
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
      console.error('Failed to load ticket', err);
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

  const handleCreateNewTicket = () => {
    // This button could navigate to a "create ticket" view or open a modal
    // For simplicity we open a minimal "new ticket" flow using prompt (substitute with real UI)
    const subject = prompt('Enter a short subject for the ticket:');
    if (!subject) return;
    const description = prompt('Describe the issue in more detail:');
    if (!description) return;

    // create a ticket via SupportService
    (async () => {
      try {
        setTicketsLoading(true);
        await SupportService.createTicket({
          transaction: {}, // no transaction link
          message: description,
          // contactEmail is optional; backend will fall back to user's email
          // subject is included inside createTicket's subject field (we set it via description fallback earlier)
        });
        await loadTickets();
        alert('Ticket created successfully.');
      } catch (err) {
        console.error('Failed to create ticket', err);
        alert('Failed to create ticket.');
      } finally {
        setTicketsLoading(false);
      }
    })();
  };

  const submitMessage = async () => {
    if (!selectedTicketId) return;
    if (!newMessage.trim()) return;
    setPostingMessage(true);
    try {
      // backend will reject internal=true for non-admins; we never set internal here
      const msg = await SupportService.addMessage(selectedTicketId, { body: newMessage.trim(), attachments: null, internal: false });
      // optimistic refresh: append returned message to UI without refetch
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
      // refresh ticket list to update lastActivityAt ordering
      await loadTickets();
    } catch (err) {
      console.error('Failed to post message', err);
      alert('Failed to send message.');
    } finally {
      setPostingMessage(false);
    }
  };

  const renderStatusBadge = (status) => {
    const map = {
      OPEN: { label: 'Open', className: 'status-pending' },
      PENDING: { label: 'Pending', className: 'status-pending' },
      RESOLVED: { label: 'Resolved', className: 'status-completed' },
      CLOSED: { label: 'Closed', className: 'status-failed' },
      DECLINED: { label: 'Declined', className: 'status-failed' }
    };
    const s = map[status] || { label: status || 'Unknown', className: '' };
    return <span className={`status-badge ${s.className}`}>{s.label}</span>;
  };

  return (
    <div className="support-center-page">
      <div className="support-header">
        <h2><FaInbox /> Support Center</h2>
        <div className="support-actions">
          <button className="btn small" onClick={handleCreateNewTicket}><FaPlus /> New Ticket</button>
        </div>
      </div>

      <div className="support-body">
        <aside className="support-sidebar">
          <h3>Your Tickets</h3>
          {ticketsLoading ? (
            <div className="loading-indicator">Loading tickets...</div>
          ) : ticketsError ? (
            <div className="error-message">{ticketsError}</div>
          ) : tickets.length === 0 ? (
            <div className="no-tickets">You have no support tickets. Create one with "New Ticket".</div>
          ) : (
            <ul className="ticket-list">
              {tickets.map(t => (
                <li
                  key={t.ticketId}
                  className={`ticket-list-item ${selectedTicketId === t.ticketId ? 'selected' : ''}`}
                  onClick={() => handleSelectTicket(t.ticketId)}
                >
                  <div className="ticket-subject">{t.subject || '(no subject)'}</div>
                  <div className="ticket-meta">
                    {renderStatusBadge(t.status)}
                    <span className="ticket-updated"> • {t.lastActivityAt ? formatDistanceToNow(new Date(t.lastActivityAt), { addSuffix: true }) : ''}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="support-main">
          {!selectedTicket ? (
            <div className="placeholder">
              <p>Select a ticket to view details and messages.</p>
            </div>
          ) : ticketLoading ? (
            <div className="loading-indicator">Loading ticket...</div>
          ) : ticketError ? (
            <div className="error-message">{ticketError}</div>
          ) : (
            <div className="ticket-detail">
              <div className="ticket-top">
                <button className="back-btn" onClick={() => setSelectedTicketId(null)}><FaChevronLeft /> Back</button>
                <div className="ticket-header">
                  <h3>{selectedTicket.subject}</h3>
                  <div className="ticket-meta">
                    {renderStatusBadge(selectedTicket.status)} &nbsp;
                    <span className="ticket-priority"><FaCircle style={{ fontSize: 8, marginRight: 6 }} /> {selectedTicket.priority}</span>
                    <span className="ticket-updated"> • Last activity {selectedTicket.lastActivityAt ? formatDistanceToNow(new Date(selectedTicket.lastActivityAt), { addSuffix: true }) : ''}</span>
                  </div>
                </div>
              </div>

              <div className="ticket-info">
                <div className="ticket-description">
                  <strong>Original description:</strong>
                  <p>{selectedTicket.description || '—'}</p>
                </div>
                <div className="ticket-links">
                  {selectedTicket.coinPurchaseId && <div>Coin Purchase: {selectedTicket.coinPurchaseId}</div>}
                  {selectedTicket.paymentId && <div>Payment: {selectedTicket.paymentId}</div>}
                  {selectedTicket.amountCents != null && <div>Amount: ${ (selectedTicket.amountCents/100).toFixed(2) } {selectedTicket.currency}</div>}
                </div>
              </div>

              <div className="message-thread">
                <h4>Conversation</h4>
                {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                  <div className="no-messages">No messages yet.</div>
                ) : (
                  <ul className="messages-list">
                    {selectedTicket.messages.map(m => (
                      <li key={m.messageId || Math.random()} className={`message-item ${m.internal ? 'internal' : 'user'}`}>
                        <div className="message-meta">
                          <span className="responder">{m.responderUserId ? (m.responderUserId === 'SYSTEM' ? 'System' : (m.responderUserId || 'You')) : 'You'}</span>
                          <span className="message-time"> • {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : ''}</span>
                          {m.internal && <span className="internal-badge">internal</span>}
                        </div>
                        <div className="message-body">{m.body}</div>
                        {m.attachments && <div className="message-attachments">Attachments: {m.attachments}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="message-composer">
                <textarea
                  rows={4}
                  placeholder="Write a message to support..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={postingMessage}
                />
                <div className="composer-actions">
                  <button className="btn" onClick={submitMessage} disabled={postingMessage || !newMessage.trim()}>
                    {postingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Minimal styles scoped for support center — adjust in your CSS files as needed */}
      <style jsx>{`
        .support-body { display:flex; gap:20px; margin-top:16px; }
        .support-sidebar { width:320px; border-right:1px solid #eee; padding-right:16px; }
        .support-main { flex:1; padding-left:16px; }
        .ticket-list { list-style:none; padding:0; margin:0; }
        .ticket-list-item { padding:12px; border-bottom:1px solid #f4f4f4; cursor:pointer; }
        .ticket-list-item.selected { background:#fafafa; }
        .ticket-subject { font-weight:600; }
        .ticket-meta { font-size:13px; color:#666; margin-top:6px; display:flex; gap:8px; align-items:center; }
        .status-badge { padding:4px 8px; border-radius:12px; font-size:12px; }
        .status-pending { background:#fff7e6; color:#b86d00; }
        .status-completed { background:#e6fff2; color:#117a3d; }
        .status-failed { background:#ffecec; color:#a00; }
        .ticket-header { display:flex; flex-direction:column; }
        .ticket-top { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
        .back-btn { background:none; border:1px solid #ddd; padding:6px 10px; border-radius:6px; cursor:pointer; }
        .message-thread { margin-top:16px; }
        .messages-list { list-style:none; padding:0; margin:0; }
        .message-item { padding:10px; border:1px solid #f0f0f0; border-radius:8px; margin-bottom:8px; }
        .message-item.user { background:#fff; }
        .message-item.internal { background:#f9fafc; border-left:4px solid #cfcff2; }
        .message-meta { font-size:12px; color:#666; margin-bottom:6px; display:flex; gap:8px; align-items:center; }
        .message-body { white-space:pre-wrap; }
        .message-composer { margin-top:12px; display:flex; flex-direction:column; gap:8px; }
        .composer-actions { display:flex; justify-content:flex-end; }
        .internal-badge { background:#333; color:#fff; padding:2px 6px; border-radius:6px; font-size:11px; margin-left:6px; }
      `}</style>
    </div>
  );
};

export default SupportCenterPage;