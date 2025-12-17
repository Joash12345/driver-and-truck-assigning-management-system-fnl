import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Calendar,
  Map,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trucks', icon: Truck, label: 'Trucks' },
  { to: '/drivers', icon: Users, label: 'Drivers' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/destinations', icon: MapPin, label: 'Tracking' },
  { to: '/tracking', icon: Map, label: 'GPS demo' },
];

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help' },
];

export const Sidebar = () => {
  const { expanded, toggleSidebar } = useSidebar();

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const linkContent = (
      <NavLink
        to={to}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          !expanded && 'justify-center px-2'
        )}
        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
      >
        <Icon className="h-5 w-5 shrink-0" />
        {expanded && <span>{label}</span>}
      </NavLink>
    );

    if (!expanded) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        expanded ? 'w-56' : 'w-16'
      )}
    >
      {/* Header */}
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-3', !expanded && 'justify-center px-2')}>
        {expanded ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">GaLang</span>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Truck className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col justify-between p-2 h-[calc(100vh-4rem)]">
        <div className="space-y-1">
          {navItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        <div className="space-y-1">
          {bottomItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
