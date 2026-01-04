import { useState, useRef } from 'react';
import { Download, Upload, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useVectorStore } from '@/store/useVectorStore';

export function Settings() {
  const { exportData, importData, resetData } = useVectorStore();
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vector-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = importData(content);
        
        if (success) {
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000);
          // Clear the input so the same file can be selected again
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          setImportStatus('error');
          setTimeout(() => setImportStatus('idle'), 3000);
        }
      } catch (error) {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetData();
    setShowResetConfirm(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight mb-1">Data Management</h2>
        <p className="text-xs text-muted-foreground">Backup, restore, or reset your data</p>
      </div>

      {/* Export Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold mb-2">Export Data</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Download a backup of your data as a JSON file. Save this file to keep your progress safe.
          </p>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            Export Backup
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold mb-2">Import Data</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Restore your data from a previously exported backup file. This will replace all current data.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file-input"
          />
          <label
            htmlFor="import-file-input"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition-colors font-medium cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import Backup
          </label>
          
          <AnimatePresence>
            {importStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 flex items-center gap-2 text-sm text-green-500"
              >
                <Check className="w-4 h-4" />
                Data imported successfully!
              </motion.div>
            )}
            {importStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 flex items-center gap-2 text-sm text-destructive"
              >
                <AlertTriangle className="w-4 h-4" />
                Import failed. Please check the file format.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reset Section */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div>
          <h3 className="text-sm font-semibold mb-2 text-destructive">Reset Data</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete all your data and reset to initial state. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-lg font-bold">Reset All Data?</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete all your tasks, attributes, progress, and settings. 
                This action cannot be undone. Make sure you have exported a backup if you want to keep your data.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

