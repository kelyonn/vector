const GIST_API_URL = 'https://api.github.com/gists';
const GIST_FILENAME = 'vector-app-data.json';

export interface GistSyncStatus {
  enabled: boolean;
  gistId: string | null;
  lastSync: string | null;
  syncing: boolean;
  error: string | null;
}

const DEFAULT_STATUS: GistSyncStatus = {
  enabled: false,
  gistId: null,
  lastSync: null,
  syncing: false,
  error: null,
};

export function getGistToken(): string | null {
  return localStorage.getItem('vector-gist-token');
}

export function saveGistToken(token: string) {
  localStorage.setItem('vector-gist-token', token);
}

export function removeGistToken() {
  localStorage.removeItem('vector-gist-token');
}

export function getGistId(): string | null {
  return localStorage.getItem('vector-gist-id');
}

export function saveGistId(gistId: string) {
  localStorage.setItem('vector-gist-id', gistId);
}

export function removeGistId() {
  localStorage.removeItem('vector-gist-id');
}

export function getSyncStatus(): GistSyncStatus {
  const stored = localStorage.getItem('vector-sync-status');
  if (stored) {
    try {
      return { ...DEFAULT_STATUS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_STATUS;
    }
  }
  return DEFAULT_STATUS;
}

export function saveSyncStatus(status: Partial<GistSyncStatus>) {
  const current = getSyncStatus();
  const updated = { ...current, ...status };
  localStorage.setItem('vector-sync-status', JSON.stringify(updated));
}

async function makeGistRequest(
  url: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: any
): Promise<any> {
  const token = getGistToken();
  if (!token) {
    throw new Error('No GitHub token configured');
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function createGist(data: string): Promise<string> {
  const response = await makeGistRequest(GIST_API_URL, 'POST', {
    description: 'Vector App Data Sync',
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: data,
      },
    },
  });

  saveGistId(response.id);
  saveSyncStatus({
    enabled: true,
    gistId: response.id,
    lastSync: new Date().toISOString(),
    error: null,
  });

  return response.id;
}

export async function updateGist(gistId: string, data: string): Promise<void> {
  await makeGistRequest(`${GIST_API_URL}/${gistId}`, 'PATCH', {
    files: {
      [GIST_FILENAME]: {
        content: data,
      },
    },
  });

  saveSyncStatus({
    lastSync: new Date().toISOString(),
    error: null,
  });
}

export async function fetchGist(gistId: string): Promise<string | null> {
  const response = await makeGistRequest(`${GIST_API_URL}/${gistId}`, 'GET');
  const file = response.files[GIST_FILENAME];
  return file?.content || null;
}

export async function pushToGist(data: string): Promise<void> {
  const token = getGistToken();
  if (!token) {
    throw new Error('No GitHub token configured');
  }

  saveSyncStatus({ syncing: true, error: null });

  try {
    let gistId = getGistId();

    if (!gistId) {
      gistId = await createGist(data);
    } else {
      await updateGist(gistId, data);
    }

    saveSyncStatus({
      enabled: true,
      gistId,
      lastSync: new Date().toISOString(),
      syncing: false,
      error: null,
    });
  } catch (error) {
    saveSyncStatus({
      syncing: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    });
    throw error;
  }
}

export async function pullFromGist(): Promise<string | null> {
  const gistId = getGistId();
  if (!gistId) {
    return null;
  }

  saveSyncStatus({ syncing: true, error: null });

  try {
    const data = await fetchGist(gistId);
    if (data) {
      saveSyncStatus({
        lastSync: new Date().toISOString(),
        syncing: false,
        error: null,
      });
    } else {
      saveSyncStatus({
        syncing: false,
        error: 'No data found in Gist',
      });
    }
    return data;
  } catch (error) {
    saveSyncStatus({
      syncing: false,
      error: error instanceof Error ? error.message : 'Pull failed',
    });
    throw error;
  }
}

export function disableGistSync() {
  removeGistToken();
  removeGistId();
  saveSyncStatus(DEFAULT_STATUS);
}
