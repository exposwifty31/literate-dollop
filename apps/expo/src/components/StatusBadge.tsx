import { Badge } from './Badge';
import type { EquipmentStatus } from '@/types/equipment';
import type { StatusVariant } from '@/src/theme/colors';

interface StatusBadgeProps {
  status: EquipmentStatus;
  /** Pre-translated label from t('status.ok') etc. */
  label: string;
}

const STATUS_TO_VARIANT: Record<EquipmentStatus, StatusVariant> = {
  ok: 'ok',
  issue: 'issue',
  critical: 'critical',
  maintenance: 'maintenance',
  sterilized: 'sterilized',
  needs_attention: 'needs_attention',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return <Badge label={label} variant={STATUS_TO_VARIANT[status]} />;
}
