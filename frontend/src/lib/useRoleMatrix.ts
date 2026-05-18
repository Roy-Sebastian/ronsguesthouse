'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from './apiFetch';
import { defaultRoleMatrix } from './rbac';

// Module-level cache — persists for the entire browser session (cleared on hard reload).
// This ensures the matrix is fetched only once even if multiple components call this hook.
let _cachedMatrix: Record<string, Record<string, boolean>> | null = null;
let _fetchPromise: Promise<void> | null = null;

/**
 * Returns the live role matrix fetched from the backend.
 * Falls back to the hardcoded defaultRoleMatrix while loading or on network error.
 * Uses a module-level singleton so the API is called only once per page session.
 */
export function useRoleMatrix(): Record<string, Record<string, boolean>> {
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(
    _cachedMatrix ?? defaultRoleMatrix,
  );

  useEffect(() => {
    // Already cached — update state immediately, no fetch needed
    if (_cachedMatrix) {
      setMatrix(_cachedMatrix);
      return;
    }

    // Kick off a single shared fetch if not already in flight
    if (!_fetchPromise) {
      _fetchPromise = apiFetch('/roles')
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            _cachedMatrix = data;
          }
        })
        .catch(() => {
          // On failure keep the hardcoded defaults — do NOT set _cachedMatrix
          // so the next render/mount can retry
          _fetchPromise = null;
        });
    }

    // Once the shared promise resolves, update local state
    _fetchPromise.then(() => {
      if (_cachedMatrix) setMatrix(_cachedMatrix);
    });
  }, []);

  return matrix;
}

/**
 * Invalidates the module-level cache so the next call to useRoleMatrix
 * will re-fetch from the backend. Call this after saving role changes.
 */
export function invalidateRoleMatrixCache() {
  _cachedMatrix = null;
  _fetchPromise = null;
}
