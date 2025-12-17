
import { Bell, Check, Trash2, X, ChevronLeft, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const NotificationItem = ({ 
  notification, 
  onMarkRead, 
  onRemove 
}: { 
  notification: Notification;
  onMarkRead: () => void;
  onRemove: () => void;
}) => {
  const navigate = useNavigate();
  const typeColors = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-destructive',
    success: 'bg-green-500',
  } as Record<string, string>;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 hover:bg-accent rounded-lg transition-colors cursor-pointer',
        !notification.read && 'bg-accent/50'
      )}
      onClick={() => {
        onMarkRead();
        if (notification.url) {
          try { navigate(notification.url); } catch (e) {}
        }
      }}
    >
      <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', typeColors[notification.type])} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', !notification.read && 'font-semibold')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

export const Header = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

  const { expanded, toggleSidebar } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label={expanded ? 'Collapse sidebar' : 'Open sidebar'}
              aria-pressed={expanded}
              title={expanded ? 'Collapse sidebar' : 'Open sidebar'}
              className="mr-3 transition-transform duration-150 ease-in-out"
            >
              {expanded ? (
                <ChevronLeft className={`h-5 w-5 motion-safe:transition-transform ${expanded ? 'rotate-0' : 'rotate-180'}`} />
              ) : (
                <Menu className={`h-5 w-5 motion-safe:transition-transform ${expanded ? 'rotate-180' : 'rotate-0'}`} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {expanded ? 'Collapse' : 'Open'}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {notifications.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={clearAll}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1 p-1">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" onClick={() => { try { logout(); } catch (e) {} try { navigate('/login'); } catch (e) {} }} className="ml-2">
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
