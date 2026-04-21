import { Link } from 'react-router-dom';
import { Settings, BarChart3, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminSection = 'setup' | 'survey' | 'live';

interface AdminSidebarProps {
  gameCode?: string;
  active: AdminSection;
  /** 'admin' shows "Admin Dashboard / Game Controller", 'live' shows "Feud Frenzy / Live Console" */
  variant?: 'admin' | 'live';
  bottomSlot?: React.ReactNode;
}

export function AdminSidebar({
  gameCode,
  active,
  variant = 'admin',
  bottomSlot,
}: AdminSidebarProps) {
  const navItems: {
    section: AdminSection;
    label: string;
    Icon: React.ElementType;
    href: string;
  }[] = [
    { section: 'setup', label: 'Setup', Icon: Settings, href: '/admin/create' },
    {
      section: 'survey',
      label: 'Survey Status',
      Icon: BarChart3,
      href: gameCode ? `/admin/game/${gameCode}` : '#',
    },
    {
      section: 'live',
      label: 'Live Game View',
      Icon: Play,
      href: gameCode ? `/admin/game/${gameCode}/live` : '#',
    },
  ];

  return (
    <aside className="hidden h-full min-h-0 w-52 shrink-0 flex-col border-r border-border/30 bg-card lg:flex">
      {/* Header */}
      <div className="px-5 pt-7 pb-6">
        {variant === 'live' ? (
          <>
            <p className="text-base font-black tracking-tight text-primary">Feud Frenzy</p>
            <p className="text-xs text-muted-foreground">Live Console</p>
          </>
        ) : (
          <>
            <p className="text-sm font-black text-primary">Admin Dashboard</p>
            <p className="text-xs text-muted-foreground">Game Controller</p>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map(({ section, label, Icon, href }) => {
          const isActive = section === active;
          return (
            <Link
              key={section}
              to={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom slot */}
      {bottomSlot && <div className="px-3 pb-6">{bottomSlot}</div>}
    </aside>
  );
}
