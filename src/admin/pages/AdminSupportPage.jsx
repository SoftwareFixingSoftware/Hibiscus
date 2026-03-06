// src/pages/SupportCenterPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SupportService from '../services/AdminSupportService';
import { formatDistanceToNow } from 'date-fns';
import { FaPaperPlane, FaUserCheck, FaTag, FaFilter } from 'react-icons/fa';

const SupportCenterPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState(null);

  // Filter state – only status now
  const [statusFilter, setStatusFilter] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Message state
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);

  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assignment state
  const [assignToAdminId, setAssignToAdminId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Load tickets with optional status filter
 // Load tickets with optional status filter
const loadTickets = useCallback(async (statusFilter) => {
  setLoadingTickets(true);
  setTicketError(null);
  try {
    // Pass the string directly, not wrapped in an object
    const resp = await SupportService.listTickets(statusFilter);
    const ticketsArray = Array.isArray(resp) ? resp : [];
    setTickets(ticketsArray);
  } catch (err) {
    console.error('Failed to load tickets', err);
    setTicketError('Failed to load tickets');
  } finally {
    setLoadingTickets(false);
  }
}, []);

  // Apply filter button handler
  const applyFilter = () => {
    setAppliedStatus(statusFilter);
    loadTickets(statusFilter);
  };

  // Initial load (no filter)
  useEffect(() => {
    loadTickets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load a single ticket (when admin clicks one)
  const loadTicketDetails = useCallback(async (ticketId) => {
    if (!ticketId) {
      setSelectedTicket(null);
      return;
    }
    setTicketLoading(true);
    setTicketError(null);
    try {
      const ticket = await SupportService.getTicket(ticketId);
      if (!ticket) {
        setSelectedTicket(null);
        setTicketError('Ticket not found');
        return;
      }
      setSelectedTicket(ticket);
      setNewStatus(ticket.status); // sync status dropdown
    } catch (err) {
      console.error('Failed to load ticket', err);
      setTicketError('Failed to load ticket details');
    } finally {
      setTicketLoading(false);
    }
  }, []);

  const handleTicketClick = (ticket) => {
    loadTicketDetails(ticket.ticketId);
  };

  // Send public reply
  const handleSendMessage = async () => {
    if (!messageBody.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await SupportService.replyToTicket(selectedTicket.ticketId, {
        body: messageBody,
        attachments: null
      });
      setMessageBody('');
      await loadTicketDetails(selectedTicket.ticketId);
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Update ticket status
  const handleUpdateStatus = async () => {
    if (!selectedTicket || !newStatus || newStatus === selectedTicket.status) return;
    setUpdatingStatus(true);
    try {
      await SupportService.updateStatus(selectedTicket.ticketId, newStatus);
      await loadTicketDetails(selectedTicket.ticketId); // refresh
      // Refresh the list to reflect status change
      loadTickets(appliedStatus);
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Assign ticket to another admin
  const handleAssign = async () => {
    if (!selectedTicket || !assignToAdminId.trim()) return;
    setAssigning(true);
    try {
      await SupportService.assignTicket(selectedTicket.ticketId, assignToAdminId);
      setAssignToAdminId('');
      await loadTicketDetails(selectedTicket.ticketId); // refresh
      loadTickets(appliedStatus); // refresh list
    } catch (err) {
      console.error('Failed to assign ticket', err);
      alert('Failed to assign ticket');
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  // Possible status values (should match backend enum)
  const statusOptions = ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED', 'DECLINED'];

  return (
    <div className="support-center-page">
      <h1>Support Center (Admin)</h1>

      {/* Filter Bar – only status */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <button onClick={applyFilter} className="filter-button">
          <FaFilter /> Apply Filter
        </button>
      </div>

      <div className="tickets-container">
        <div className="tickets-list">
          <h2>Tickets ({tickets.length})</h2>
          {loadingTickets && <p>Loading tickets...</p>}
          {!loadingTickets && ticketError && <p className="error">{ticketError}</p>}
          {!loadingTickets && !ticketError && tickets.length === 0 && (
            <p>No tickets found.</p>
          )}
          {!loadingTickets && !ticketError && tickets.length > 0 && (
            <ul>
              {tickets.map(t => (
                <li
                  key={t.ticketId}
                  className={selectedTicket?.ticketId === t.ticketId ? 'active' : ''}
                  onClick={() => handleTicketClick(t)}
                >
                  <strong>{t.subject}</strong> - {t.status}
                  {t.assignedAdminId && <span> (Assigned)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ticket-details">
          {ticketLoading && <p>Loading ticket...</p>}
          {!ticketLoading && selectedTicket && (
            <>
              <h2>{selectedTicket.subject}</h2>
              <p>{selectedTicket.description}</p>
              <div className="ticket-meta">
                <span>Status: {selectedTicket.status}</span>
                <span>Priority: {selectedTicket.priority}</span>
                {selectedTicket.amountCents && (
                  <span>
                    Amount: ${(selectedTicket.amountCents / 100).toFixed(2)} {selectedTicket.currency}
                  </span>
                )}
                {selectedTicket.paymentId && (
                  <span>
                    Payment: <Link to={`/admin/payments/${selectedTicket.paymentId}`}>{selectedTicket.paymentId}</Link>
                  </span>
                )}
                {selectedTicket.coinPurchaseId && (
                  <span>Coin Purchase ID: {selectedTicket.coinPurchaseId}</span>
                )}
                {selectedTicket.episodePurchaseId && (
                  <span>Episode Purchase ID: {selectedTicket.episodePurchaseId}</span>
                )}
                {selectedTicket.txId && (
                  <span>Transaction ID: {selectedTicket.txId}</span>
                )}
                {selectedTicket.assignedAdminId && (
                  <span>Assigned to: {selectedTicket.assignedAdminId}</span>
                )}
              </div>

              {/* Admin Actions */}
              <div className="admin-actions">
                <div className="status-update">
                  <label>Change Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    disabled={updatingStatus}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button onClick={handleUpdateStatus} disabled={updatingStatus || newStatus === selectedTicket.status}>
                    {updatingStatus ? 'Updating...' : <><FaTag /> Update</>}
                  </button>
                </div>

                <div className="assign-ticket">
                  <label>Assign to Admin (UUID):</label>
                  <input
                    type="text"
                    value={assignToAdminId}
                    onChange={(e) => setAssignToAdminId(e.target.value)}
                    placeholder="Enter admin user ID"
                    disabled={assigning}
                  />
                  <button onClick={handleAssign} disabled={assigning || !assignToAdminId.trim()}>
                    {assigning ? 'Assigning...' : <><FaUserCheck /> Assign</>}
                  </button>
                </div>
              </div>

              <div className="messages-section">
                <h3>Messages</h3>
                {selectedTicket.messages.length === 0 ? (
                  <p>No messages yet.</p>
                ) : (
                  <ul>
                    {selectedTicket.messages.map(m => (
                      <li key={m.messageId} className={m.internal ? 'internal' : ''}>
                        <div className="msg-header">
                          <span className="responder">{m.responderUserId}</span>
                          <span className="msg-time">{formatDate(m.createdAt)}</span>
                          {m.internal && <span className="internal-badge">Internal</span>}
                        </div>
                        <div className="msg-body">{m.body}</div>
                        {m.attachments && m.attachments.length > 0 && (
                          <ul className="attachments">
                            {m.attachments.map((a, i) => (
                              <li key={i}>
                                <a href={a.url} target="_blank" rel="noreferrer">{a.name}</a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="send-message">
                  <textarea
                    rows={3}
                    value={messageBody}
                    onChange={e => setMessageBody(e.target.value)}
                    placeholder="Write a public reply..."
                  />
                  <button onClick={handleSendMessage} disabled={sending || !messageBody.trim()}>
                    {sending ? 'Sending...' : <><FaPaperPlane /> Send</>}
                  </button>
                </div>
              </div>
            </>
          )}
          {!ticketLoading && !selectedTicket && (
            <p>Select a ticket to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportCenterPage;