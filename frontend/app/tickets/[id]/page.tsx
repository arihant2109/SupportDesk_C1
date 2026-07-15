'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { CommentsSection } from '@/components/CommentsSection';
import { ErrorState } from '@/components/ErrorState';
import { FormField } from '@/components/FormField';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Toast } from '@/components/Toast';
import { TransitionPanel } from '@/components/TransitionPanel';
import { Button, Icon, IconButton } from '@/components/ui';
import { getActiveUsers, getTicket, updateTicket, updateTicketStatus } from '@/lib/api';
import { filterAssignableUsers, formatDate, formatStatusLabel, shortTicketId } from '@/lib/utils';
import { Priority, Status, Ticket, User } from '@/types';

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { canWrite } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignedToId, setAssignedToId] = useState('');
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    getActiveUsers()
      .then((data) => setUsers(filterAssignableUsers(data)))
      .catch((fetchError) => {
        setUsersError((fetchError as Error).message || 'Failed to load assignees');
      });
  }, []);

  const resetForm = useCallback((data: Ticket) => {
    setTitle(data.title);
    setDescription(data.description);
    setPriority(data.priority);
    setAssignedToId(data.assignedToId ?? '');
  }, []);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTicket(params.id);
      setTicket(data);
      resetForm(data);
    } catch (fetchError) {
      setError((fetchError as Error).message || 'Ticket not found');
    } finally {
      setLoading(false);
    }
  }, [params.id, resetForm]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleCancelEdit = () => {
    if (ticket) {
      resetForm(ticket);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!ticket) return;

    setSaving(true);
    try {
      const updated = await updateTicket(ticket.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedToId: assignedToId || null,
      });
      setTicket(updated);
      resetForm(updated);
      setIsEditing(false);
      setToast({ title: 'Saved', message: 'Ticket updated successfully.' });
    } catch (saveError) {
      setToast({
        title: 'Save failed',
        message: (saveError as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async (status: Status) => {
    if (!ticket) return;

    setTransitioning(true);
    try {
      const updated = await updateTicketStatus(ticket.id, { status });
      setTicket(updated);
      resetForm(updated);
    } catch (transitionError) {
      const message =
        (transitionError as { message?: string }).message ??
        `Can't move from ${formatStatusLabel(ticket.status)} to ${formatStatusLabel(status)}. Invalid state transition.`;

      setToast({
        title: 'Transition rejected',
        message,
      });
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <main className="body-pad">
        <div className="row-count">Loading ticket...</div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="body-pad">
        <ErrorState
          title="Ticket not found"
          description={error ?? 'The requested ticket could not be loaded.'}
          onRetry={loadTicket}
        />
        <div style={{ marginTop: 16 }}>
          <Link className="view-link" href="/tickets">
            <Icon name="arrow-left" className="icon icon-sm" />
            Back to Tickets
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="toast-wrap">
      {toast ? (
        <Toast title={toast.title} message={toast.message} onClose={dismissToast} />
      ) : null}

      <main className="body-pad">
        <div className="breadcrumb">
          <Link href="/tickets">
            <Icon name="arrow-left" className="icon icon-sm" />
            Back to Tickets
          </Link>
          <span>/</span>
          <span>Ticket {shortTicketId(ticket.id)}</span>
        </div>

        {usersError ? <div className="error-msg" style={{ marginBottom: 12 }}>{usersError}</div> : null}

        <div className="detail-columns">
          <div className="left-col card">
            <div className="title-row">
              {isEditing ? (
                <h2 style={{ flex: 1 }}>Edit ticket</h2>
              ) : (
                <h2>{ticket.title}</h2>
              )}

              {canWrite ? (
                isEditing ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" onClick={handleCancelEdit} disabled={saving}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                      <Icon name="check" className="icon" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <IconButton
                    title="Edit ticket"
                    aria-label="Edit ticket"
                    onClick={() => setIsEditing(true)}
                  >
                    <Icon name="edit" className="icon" />
                  </IconButton>
                )
              ) : null}
            </div>

            {isEditing ? (
              <>
                <FormField label="Title">
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </FormField>
                <FormField label="Description">
                  <textarea
                    style={{ minHeight: 110 }}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </FormField>
              </>
            ) : (
              <div>
                <div className="section-label" style={{ marginBottom: 8 }}>
                  Description
                </div>
                <div className="desc-text">{ticket.description}</div>
              </div>
            )}

            <CommentsSection
              ticketId={ticket.id}
              comments={ticket.comments ?? []}
              onCommentAdded={loadTicket}
              readOnly={!canWrite || isEditing}
            />
          </div>

          <div className="right-panel card">
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>
                Status
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            {canWrite ? (
              <TransitionPanel
                currentStatus={ticket.status}
                onTransition={handleTransition}
                disabled={transitioning || saving}
              />
            ) : null}

            <hr className="divider" />

            {isEditing && canWrite ? (
              <>
                <FormField label="Priority">
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as Priority)}
                  >
                    {(['low', 'medium', 'high', 'critical'] as Priority[]).map((item) => (
                      <option key={item} value={item}>
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Assignee">
                  <select
                    value={assignedToId}
                    onChange={(event) => setAssignedToId(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </>
            ) : (
              <>
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>
                    Priority
                  </div>
                  <PriorityBadge priority={ticket.priority} />
                </div>

                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>
                    Assignee
                  </div>
                  <div className="value-strong">
                    {ticket.assignedTo?.name ?? 'Unassigned'}
                  </div>
                </div>
              </>
            )}

            <div className="meta-line">
              Created by {ticket.createdBy.name} · {formatDate(ticket.createdAt)}
            </div>
            <div className="meta-line">Last updated {formatDate(ticket.updatedAt)}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
