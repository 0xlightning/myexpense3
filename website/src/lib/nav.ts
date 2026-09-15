import {
  LayoutDashboard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { KINDS, type Kind } from '@/lib/kinds'

export const KIND_ICONS: Record<Kind, LucideIcon> = {
  income: TrendingUp,
  expenditure: TrendingDown,
  investment: PiggyBank,
}

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  ...KINDS.map((k) => ({ to: k.path, label: k.label, icon: KIND_ICONS[k.kind] })),
]
