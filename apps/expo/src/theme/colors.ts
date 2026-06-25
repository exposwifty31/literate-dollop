export const colors = {
  primary: {
    50: '#e9f4ea',
    100: '#c8e4cc',
    200: '#a8d4ae',
    600: '#1e7a32',
    700: '#1e4a25',
  },

  status: {
    ok: '#16a34a',
    okBg: '#f0fdf4',
    okText: '#14532d',
    issue: '#d97706',
    issueBg: '#fffbeb',
    issueText: '#78350f',
    critical: '#b91c1c',
    criticalBg: '#fff5f5',
    criticalText: '#7f1d1d',
    maintenance: '#d97706',
    maintenanceBg: '#fffbeb',
    maintenanceText: '#78350f',
    sterilized: '#0891b2',
    sterilizedBg: '#ecfeff',
    sterilizedText: '#164e63',
    needs_attention: '#c2410c',
    needs_attentionBg: '#fff7ed',
    needs_attentionText: '#7c2d12',
    offline: '#fef3c7',
    offlineText: '#78350f',
  },

  semantic: {
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0284c7',
  },

  emergency: {
    bg: '#0c0c0c',
    surface: '#18181b',
    accent: '#ef4444',
    amber: '#fbbf24',
  },

  // Neutrals — "Ivory" palette
  background: '#f6f7fb',
  surface: '#ffffff',
  border: '#d8dce6',
  borderStrong: '#bcc2d4',
  text: '#111a12',
  textSecondary: '#2e394d',
  textTertiary: '#5a6884',

  // Focus ring — 3:1 contrast on all backgrounds
  focusRing: '#1e7a32',
} as const;

export type StatusVariant = 'ok' | 'issue' | 'critical' | 'maintenance' | 'sterilized' | 'needs_attention' | 'offline';

export const statusVariantColors: Record<StatusVariant, { bg: string; text: string; border: string }> = {
  ok: { bg: colors.status.okBg, text: colors.status.okText, border: colors.status.ok },
  issue: { bg: colors.status.issueBg, text: colors.status.issueText, border: colors.status.issue },
  critical: { bg: colors.status.criticalBg, text: colors.status.criticalText, border: colors.status.critical },
  maintenance: { bg: colors.status.maintenanceBg, text: colors.status.maintenanceText, border: colors.status.maintenance },
  sterilized: { bg: colors.status.sterilizedBg, text: colors.status.sterilizedText, border: colors.status.sterilized },
  needs_attention: { bg: colors.status.needs_attentionBg, text: colors.status.needs_attentionText, border: colors.status.needs_attention },
  offline: { bg: colors.status.offline, text: colors.status.offlineText, border: colors.status.issue },
};
