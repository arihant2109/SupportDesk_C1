'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { Button, Icon, IconButton } from '@/components/ui';
import {
  createUser,
  deactivateUser,
  getAdminUsers,
  updateUser,
} from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AdminUser, Role } from '@/types';

const roles: Role[] = ['admin', 'agent', 'viewer'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('agent');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (fetchError) {
      setError((fetchError as Error).message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('agent');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: name.trim(),
          email: email.trim(),
          role,
          ...(password ? { password } : {}),
        });
      } else {
        await createUser({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        });
      }
      closeModal();
      await loadUsers();
    } catch (submitError) {
      const details = (submitError as { details?: string[] }).details;
      setFormError(details?.[0] ?? (submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeactivateModal = (user: AdminUser) => {
    setDeactivatingUser(user);
    setShowDeactivateModal(true);
  };

  const handleDeactivate = async () => {
    if (!deactivatingUser) return;

    try {
      await deactivateUser(deactivatingUser.id);
      setShowDeactivateModal(false);
      setDeactivatingUser(null);
      await loadUsers();
    } catch (deactivateError) {
      setError((deactivateError as Error).message);
      setShowDeactivateModal(false);
    }
  };

  const handleReactivate = async (user: AdminUser) => {
    try {
      await updateUser(user.id, { isActive: true });
      await loadUsers();
    } catch (reactivateError) {
      setError((reactivateError as Error).message);
    }
  };

  return (
    <main className="body-pad">
      <h1 className="page-title">User Management</h1>

      <div className="toolbar">
        <div />
        <Button variant="primary" onClick={openCreateModal}>
          <Icon name="plus" className="icon" />
          Add User
        </Button>
      </div>

      {loading ? <div className="row-count">Loading users...</div> : null}

      {!loading && error ? (
        <div className="error-msg" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button type="button" className="view-link" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {!loading && !error && users.length === 0 ? <EmptyState /> : null}

      {!loading && !error && users.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="title-cell">{user.name}</td>
                  <td>{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                  <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" onClick={() => openEditModal(user)}>
                        Edit
                      </Button>
                      {user.isActive ? (
                        <Button variant="danger" onClick={() => openDeactivateModal(user)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => handleReactivate(user)}>
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showModal ? (
        <div className="modal-overlay">
          <form className="modal" onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add User'}</h2>
              <IconButton
                type="button"
                className="modal-close sm ghost"
                onClick={closeModal}
                aria-label="Close user modal"
              >
                <Icon name="x" className="icon icon-sm" />
              </IconButton>
            </div>

            <FormField label="Name" required>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </FormField>

            <FormField label="Email" required>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>

            <FormField label={editingUser ? 'New Password (optional)' : 'Password'} required={!editingUser}>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>

            <FormField label="Role" required>
              <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
            </FormField>

            {formError ? <span className="error-msg">{formError}</span> : null}

            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {showDeactivateModal && deactivatingUser ? (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Deactivate User</h2>
              <IconButton
                type="button"
                className="modal-close sm ghost"
                onClick={() => setShowDeactivateModal(false)}
                aria-label="Close deactivate modal"
              >
                <Icon name="x" className="icon icon-sm" />
              </IconButton>
            </div>
            <p>Deactivate {deactivatingUser.name}? They will no longer be able to sign in.</p>
            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={() => setShowDeactivateModal(false)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={handleDeactivate}>
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
