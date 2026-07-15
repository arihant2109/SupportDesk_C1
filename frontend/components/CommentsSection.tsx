'use client';

import { FormEvent, useState } from 'react';
import { IconButton, Icon } from '@/components/ui';
import { createComment } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Comment } from '@/types';

export function CommentsSection({
  ticketId,
  comments,
  onCommentAdded,
  readOnly = false,
}: {
  ticketId: string;
  comments: Comment[];
  onCommentAdded: () => Promise<void> | void;
  readOnly?: boolean;
}) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();

    if (!message.trim()) {
      setError('Comment message is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createComment(ticketId, {
        message: message.trim(),
      });
      setMessage('');
      await onCommentAdded();
    } catch (submitError) {
      const details = (submitError as { details?: string[] }).details;
      setError(details?.[0] ?? 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comments-card">
      <h3>Comments ({comments.length})</h3>
      {comments.map((comment) => (
        <div className="comment" key={comment.id}>
          <div className="avatar" />
          <div className="comment-body">
            <div className="comment-head">
              <span className="comment-name">{comment.createdBy.name}</span>
              <span className="comment-time">{formatDateTime(comment.createdAt)}</span>
            </div>
            <div className="comment-msg">{comment.message}</div>
          </div>
        </div>
      ))}
      {!readOnly ? (
        <form onSubmit={handleSubmit}>
          <textarea
            className="comment-input"
            placeholder="Write a comment..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          {error ? <span className="error-msg">{error}</span> : null}
          <div className="comment-actions">
            <IconButton
              type="submit"
              className="round primary"
              title="Post comment"
              aria-label="Post comment"
              disabled={submitting}
            >
              <Icon name="send" className="icon" />
            </IconButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
