'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { FormField } from '@/components/FormField';
import { Button, Icon, IconButton } from '@/components/ui';
import { createTicket, getActiveUsers } from '@/lib/api';
import { filterAssignableUsers } from '@/lib/utils';
import { Priority, User } from '@/types';

const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];

export default function CreateTicketPage() {
  const router = useRouter();
  const { canWrite } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [assignedToId, setAssignedToId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canWrite) {
      router.replace('/tickets');
      return;
    }

    getActiveUsers()
      .then((data) => setUsers(filterAssignableUsers(data)))
      .catch((fetchError) => {
        setUsersError((fetchError as Error).message || 'Failed to load assignees');
      });
  }, [canWrite, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (!description.trim()) nextErrors.description = 'Description is required';
    if (!priority) nextErrors.priority = 'Priority is required';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        priority: priority as Priority,
        assignedToId: assignedToId || null,
      });

      router.push(`/tickets/${ticket.id}`);
    } catch (submitError) {
      const details = (submitError as { details?: string[] }).details ?? [];
      const apiErrors: Record<string, string> = {};

      details.forEach((detail) => {
        if (detail.toLowerCase().includes('title')) apiErrors.title = detail;
        if (detail.toLowerCase().includes('description')) apiErrors.description = detail;
        if (detail.toLowerCase().includes('priority')) apiErrors.priority = detail;
      });

      setErrors(apiErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Create New Ticket</h2>
          <IconButton
            type="button"
            className="modal-close sm ghost"
            onClick={() => router.push('/tickets')}
            aria-label="Close create ticket modal"
          >
            <Icon name="x" className="icon icon-sm" />
          </IconButton>
        </div>

        {usersError ? <span className="error-msg">{usersError}</span> : null}

        <FormField label="Title" required error={errors.title}>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Brief summary of the issue"
            required
          />
        </FormField>

        <FormField label="Description" required error={errors.description}>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Steps to reproduce, expected vs actual behavior..."
            required
          />
        </FormField>

        <div className="field-row">
          <FormField label="Priority" required error={errors.priority}>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority | '')}
              required
            >
              <option value="" disabled>
                Select priority
              </option>
              {priorities.map((item) => (
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
        </div>

        <div className="modal-footer">
          <Button type="button" variant="secondary" onClick={() => router.push('/tickets')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            Create Ticket
          </Button>
        </div>
      </form>
    </div>
  );
}
