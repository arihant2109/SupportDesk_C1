'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { TicketTable } from '@/components/TicketTable';
import { Button, Icon } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { getTickets } from '@/lib/api';
import { formatStatusLabel, SortField, SortOrder } from '@/lib/utils';
import { Status, Ticket } from '@/types';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 20;

export default function TicketsPage() {
  return (
    <Suspense fallback={<main className="body-pad"><div className="row-count">Loading...</div></main>}>
      <TicketsPageContent />
    </Suspense>
  );
}

function TicketsPageContent() {
  const searchParams = useSearchParams();
  const { canWrite } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [allTicketCount, setAllTicketCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortField>('createdAt');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deniedBanner, setDeniedBanner] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchParams.get('denied') === 'admin') {
      setDeniedBanner(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sort, order]);

  const loadTickets = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await getTickets(
        {
          search: debouncedSearch || undefined,
          status: status || undefined,
          page,
          limit: PAGE_SIZE,
          sort,
          order,
        },
        controller.signal
      );

      if (controller.signal.aborted) {
        return;
      }

      setTickets(result.tickets);
      setAllTicketCount(result.total);
    } catch (fetchError) {
      if ((fetchError as Error).name === 'AbortError') {
        return;
      }
      setError((fetchError as Error).message || 'Failed to load tickets');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, status, page, sort, order]);

  useEffect(() => {
    loadTickets();
    return () => abortRef.current?.abort();
  }, [loadTickets]);

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSort(field);
    setOrder('asc');
  };

  const hasFilters = Boolean(debouncedSearch || status);
  const totalPages = Math.max(1, Math.ceil(allTicketCount / PAGE_SIZE));

  const resultSummary = useMemo(() => {
    if (!hasFilters) {
      return `Showing ${tickets.length} of ${allTicketCount} tickets (page ${page} of ${totalPages})`;
    }

    const statusLabel = status ? formatStatusLabel(status as Status) : 'All';
    return `${tickets.length} result${tickets.length === 1 ? '' : 's'} for "${debouncedSearch || 'all'}" in status ${statusLabel}`;
  }, [allTicketCount, debouncedSearch, hasFilters, page, status, tickets.length, totalPages]);

  return (
    <main className="body-pad">
      <h1 className="page-title">Tickets</h1>

      {deniedBanner ? (
        <div className="error-msg" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span>You do not have permission to access that page.</span>
          <button type="button" className="view-link" onClick={() => setDeniedBanner(false)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="toolbar">
        <div className="toolbar-left">
          <div className={`search-input ${search ? 'active-state' : ''}`}>
            <Icon name="search" className="icon" />
            <input
              type="text"
              placeholder="Search tickets by title or keyword..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={`filter-select ${status ? 'active-state' : ''}`}>
            <span>Status: {status ? formatStatusLabel(status as Status) : 'All'}</span>
            <Icon name="chevron-down" className="icon icon-sm" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {hasFilters ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('');
                setStatus('');
              }}
            >
              <Icon name="x" className="icon icon-sm" />
              Clear filters
            </Button>
          ) : null}
          {canWrite ? (
            <Link href="/tickets/new">
              <Button variant="primary">
                <Icon name="plus" className="icon" />
                Create Ticket
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? <div className="row-count">Loading tickets...</div> : null}

      {!loading && error ? <ErrorState onRetry={loadTickets} /> : null}

      {!loading && !error && tickets.length === 0 ? <EmptyState /> : null}

      {!loading && !error && tickets.length > 0 ? (
        <>
          <div className="row-count" style={{ margin: hasFilters ? '0 0 12px' : undefined }}>
            {resultSummary}
          </div>
          <TicketTable
            tickets={tickets}
            search={debouncedSearch}
            sort={sort}
            order={order}
            onSort={handleSort}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <span className="row-count">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}
    </main>
  );
}
