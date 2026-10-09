import React, { useState, useEffect } from 'react';
import { Shield, Search } from 'lucide-react';
import { api } from '../../api/client.ts';
import { AuditLog } from '../../types/index.ts';
import { Pagination } from '../common/Pagination.tsx';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (page = currentPage, query = search) => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(page, pageSize, query);
      setLogs(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
      setCurrentPage(res.pagination.currentPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, search);
  }, [search, pageSize]);

  return (
    <div className="space-y-4 font-ui">
      <div>
        <h2 className="font-display font-bold text-2xl text-[#08090B] dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#16865B] dark:text-[#C8F85A]" />
          System Audit Trail (Security & Compliance)
        </h2>
        <p className="text-xs text-[#68717D] dark:text-slate-400">
          Immutable log of administrative operations, branch configurations, and student unlocks.
        </p>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#68717D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search action or target..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
          />
        </div>
        <div className="text-xs text-[#68717D] dark:text-slate-400 hidden sm:block">
          Recorded Actions: <span className="font-bold text-[#08090B] dark:text-white">{totalItems}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#68717D]">
            No audit logs match search criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F3] dark:bg-slate-800/60 border-b border-[#DDE3E8] dark:border-slate-800 text-[11px] font-bold text-[#68717D] dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Admin Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Entity</th>
                    <th className="py-3.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3E8] dark:divide-slate-800 text-xs font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F7F7F3]/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-[#68717D] text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-[#08090B] dark:text-slate-300 font-bold">
                        {log.adminEmail}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D9ECF8] text-[#08090B]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-bold text-[#08090B] dark:text-white">
                        {log.target}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-[#68717D] max-w-sm truncate" title={log.details || ''}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(page) => fetchLogs(page, search)}
              onPageSizeChange={(size) => setPageSize(size)}
            />
          </>
        )}
      </div>
    </div>
  );
};
