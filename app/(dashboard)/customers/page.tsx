'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Search, Users } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { USER_STATUS_MAP, formatDateTime, cn } from '@/lib/utils';
import type { User } from '@/types';

const STATUS_FILTERS = [
  { value: '', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' },
  { value: 'suspended', label: '정지' },
];

const LIMIT = 20;

export default function CustomersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, statusFilter, search],
    queryFn: () =>
      usersApi.getList({
        page,
        limit: LIMIT,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

  const users: User[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="filter-tabs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={cn('filter-tab', statusFilter === f.value && 'filter-tab-active')}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="search-wrapper sm:ml-auto">
          <Search size={13} className="shrink-0 text-text-muted" />
          <input
            type="text"
            placeholder="이메일로 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-w-0 w-40 bg-transparent text-xs outline-none placeholder-text-muted"
          />
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm font-medium text-text-secondary">
            총 <span className="font-bold text-text-primary">{total}</span>명
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="고객이 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light bg-surface-muted/60">
                  <th className="table-th">ID</th>
                  <th className="table-th">이메일</th>
                  <th className="table-th">연락처</th>
                  <th className="table-th">상태</th>
                  <th className="table-th">마케팅 동의</th>
                  <th className="table-th">마지막 로그인</th>
                  <th className="table-th">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {users.map((user) => {
                  const statusInfo = USER_STATUS_MAP[user.status];
                  return (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/customers/${user.id}`)}
                      className="cursor-pointer transition-colors hover:bg-surface-muted/50"
                    >
                      <td className="table-td font-mono text-xs text-text-muted">#{user.id}</td>
                      <td className="table-td font-medium text-text-primary">{user.email}</td>
                      <td className="table-td text-text-secondary">{user.phone ?? '-'}</td>
                      <td className="table-td">
                        {statusInfo && <Badge label={statusInfo.label} color={statusInfo.color} />}
                      </td>
                      <td className="table-td">
                        <span className={cn('text-xs font-medium', user.isAllowMarketing ? 'text-green-600' : 'text-text-muted')}>
                          {user.isAllowMarketing ? '동의' : '미동의'}
                        </span>
                      </td>
                      <td className="table-td text-text-secondary">{formatDateTime(user.lastLoginAt)}</td>
                      <td className="table-td text-text-secondary">{formatDateTime(user.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-border-light px-5 py-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
