import { useState, useRef, useEffect } from 'react';
import { Download, Upload, RotateCcw, AlertTriangle, Check, Bell, BellOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  getDefaultNotificationSettings, 
  saveNotificationSettings, 
  scheduleDailyNotifications,
  type NotificationSettings 
} from '@/lib/notifications';
import {
  getGistToken,
  saveGistToken,
  getSyncStatus,
  pushToGist,
  pullFromGist,
  disableGistSync,
  type GistSyncStatus,
} from '@/lib/gistSync';
import { useVectorStore } from '@/store/useVectorStore';

export function Settings() {
  const { exportData, importData, resetData } = useVectorStore();
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(getDefaultNotificationSettings());
  const [syncStatus, setSyncStatus] = useState<GistSyncStatus>(getSyncStatus());
  const [gistToken, setGistToken] = useState<string>(getGistToken() || '');
  const [showTokenInput, setShowTokenInput] = useState(!getGistToken());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scheduleDailyNotifications(notificationSettings);
  }, [notificationSettings]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleNotificationToggle = (enabled: boolean) => {
    const newSettings = { ...notificationSettings, enabled };
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleTimeChange = (type: 'morning' | 'evening', time: string) => {
    const newSettings = {
      ...notificationSettings,
      [type === 'morning' ? 'morningTime' : 'eveningTime']: time,
    };
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleNotificationPreferenceChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleGistTokenSave = async () => {
    if (!gistToken.trim()) return;
    
    saveGistToken(gistToken.trim());
    setShowTokenInput(false);
    setSyncStatus(getSyncStatus());
    
    try {
      const data = exportData();
      await pushToGist(data);
      setSyncStatus(getSyncStatus());
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  };

  const handleGistSync = async () => {
    try {
      const data = exportData();
      await pushToGist(data);
      setSyncStatus(getSyncStatus());
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleGistPull = async () => {
    try {
      const data = await pullFromGist();
      if (data) {
        const success = importData(data);
        if (success) {
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000);
        } else {
          setImportStatus('error');
          setTimeout(() => setImportStatus('idle'), 3000);
        }
      }
      setSyncStatus(getSyncStatus());
    } catch (error) {
      console.error('Pull failed:', error);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleDisableGistSync = () => {
    disableGistSync();
    setGistToken('');
    setShowTokenInput(true);
    setSyncStatus(getSyncStatus());
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight mb-1">Settings</h2>
        <p className="text-xs text-muted-foreground">Manage your app preferences</p>
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <div>
          <h3 className="text-sm font-semibold mb-2">Notifications</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Set up daily reminders for Iron Rules and goals
          </p>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-secondary/50 border border-border rounded-lg cursor-pointer">
              <div className="flex items-center gap-2">
                {notificationSettings.enabled ? (
                  <Bell className="w-4 h-4 text-primary" />
                ) : (
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Enable Notifications</span>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.enabled}
                onChange={(e) => handleNotificationToggle(e.target.checked)}
                className="rounded"
              />
            </label>

            {notificationSettings.enabled && (
              <div className="space-y-2 pl-6">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Morning Reminder</label>
                  <input
                    type="time"
                    value={notificationSettings.morningTime}
                    onChange={(e) => handleTimeChange('morning', e.target.value)}
                    className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Evening Reminder</label>
                  <input
                    type="time"
                    value={notificationSettings.eveningTime}
                    onChange={(e) => handleTimeChange('evening', e.target.value)}
                    className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <label className="flex items-center gap-2 p-2 bg-secondary/30 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.remindIronRules}
                    onChange={(e) => handleNotificationPreferenceChange('remindIronRules', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">Remind about Iron Rules</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-secondary/30 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.remindGoals}
                    onChange={(e) => handleNotificationPreferenceChange('remindGoals', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">Remind about Goals</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <div>
          <h3 className="text-sm font-semibold mb-2">Cloud Sync (GitHub Gist)</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Automatically sync your data to GitHub Gist for multi-device access
          </p>
          
          {!syncStatus.enabled && (
            <div className="space-y-3">
              {showTokenInput ? (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground block">
                    GitHub Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={gistToken}
                    onChange={(e) => setGistToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full bg-background border border-border rounded p-2 text-sm focus:outline-none focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Create a token at github.com/settings/tokens with "gist" scope
                  </p>
                  <button
                    onClick={handleGistTokenSave}
                    disabled={!gistToken.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Cloud className="w-4 h-4" />
                    Enable Sync
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTokenInput(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
                >
                  <CloudOff className="w-4 h-4" />
                  Configure Sync
                </button>
              )}
            </div>
          )}

          {syncStatus.enabled && (
            <div className="space-y-3">
              <div className="p-3 bg-secondary/50 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Sync Enabled</span>
                  </div>
                  {syncStatus.syncing && (
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {syncStatus.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                  </p>
                )}
                {syncStatus.error && (
                  <p className="text-xs text-destructive mt-1">{syncStatus.error}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGistSync}
                  disabled={syncStatus.syncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.syncing ? 'animate-spin' : ''}`} />
                  Push to Cloud
                </button>
                <button
                  onClick={handleGistPull}
                  disabled={syncStatus.syncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Pull from Cloud
                </button>
              </div>

              <button
                onClick={handleDisableGistSync}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors font-medium"
              >
                <CloudOff className="w-4 h-4" />
                Disable Sync
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <div>
          <h3 className="text-sm font-semibold mb-2">Data Management</h3>
          <p className="text-xs text-muted-foreground mb-3">Backup, restore, or reset your data</p>
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

