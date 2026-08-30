/**
 * ==============================================================================
 * SkinLab AI - Module 12: SQL Backup Dump Generator Modal
 * ==============================================================================
 * Triggers on-demand generation of a complete .sql database backup file,
 * displays preview, and allows direct download.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Database, Download, CheckCircle2, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';

export default function SQLBackupModal({ onClose }) {
  const [backupData, setBackupData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBackup = async () => {
      try {
        const res = await api.exportSQLBackup();
        if (res && res.sql_dump) {
          setBackupData(res);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBackup();
  }, []);

  const handleDownload = () => {
    if (!backupData) return;
    const blob = new Blob([backupData.sql_dump], { type: 'application/sql' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupData.filename;
    a.click();
  };

  const handleCopy = () => {
    if (!backupData) return;
    navigator.clipboard.writeText(backupData.sql_dump);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 max-w-2xl w-full border border-teal-500/30 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Automated Database SQL Backup Dump</h3>
              <p className="text-[11px] text-slate-400">Timestamped snapshot of patients, sales, and catalog</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Generating complete SQL backup dump...
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Generated File: <strong className="font-mono text-teal-400">{backupData?.filename}</strong>
              </span>
              <span className="text-emerald-400 font-semibold">
                {backupData?.total_records_backed_up} Records Exported
              </span>
            </div>

            {/* SQL Script View */}
            <div className="h-64 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
              {backupData?.sql_dump}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center space-x-1"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy SQL'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .sql File</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
