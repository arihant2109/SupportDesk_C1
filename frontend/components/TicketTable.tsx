'use client';

import Link from 'next/link';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/components/ui';
import { formatDate, shortTicketId, SortField, SortOrder } from '@/lib/utils';
import { Ticket } from '@/types';

export function TicketTable({
  tickets,
  search,
  sort,
  order,
  onSort,
}: {
  tickets: Ticket[];
  search?: string;
  sort?: SortField;
  order?: SortOrder;
  onSort?: (field: SortField) => void;
}) {
  const renderSortLabel = (field: SortField, label: string) => {
    if (!onSort) {
      return label;
    }

    const isActive = sort === field;
    const arrow = isActive ? (order === 'asc' ? ' ↑' : ' ↓') : '';
    return (
      <button
        type="button"
        className="view-link"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        onClick={() => onSort(field)}
      >
        {label}
        {arrow}
      </button>
    );
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{renderSortLabel('title', 'Title')}</th>
            <th>{renderSortLabel('priority', 'Priority')}</th>
            <th>{renderSortLabel('status', 'Status')}</th>
            <th>Assignee</th>
            <th>{renderSortLabel('createdAt', 'Created')}</th>
            <th>{renderSortLabel('updatedAt', 'Updated')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const isHighlighted =
              !!search &&
              ticket.title.toLowerCase().includes(search.toLowerCase());

            return (
              <tr key={ticket.id}>
                <td>{shortTicketId(ticket.id)}</td>
                <td className={`title-cell ${isHighlighted ? 'highlight' : ''}`}>
                  {ticket.title}
                </td>
                <td>
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td>
                  <StatusBadge status={ticket.status} />
                </td>
                <td>{ticket.assignedTo?.name ?? 'Unassigned'}</td>
                <td>{formatDate(ticket.createdAt)}</td>
                <td>{formatDate(ticket.updatedAt)}</td>
                <td>
                  <Link className="view-link" href={`/tickets/${ticket.id}`}>
                    View <Icon name="arrow-right" className="icon icon-sm" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
