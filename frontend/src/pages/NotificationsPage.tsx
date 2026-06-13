import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/ui';

const TYPE_STYLES: Record<string, { icon: string; bg: string; border: string }> = {
  MORNING_BRIEF: { icon: '☀️', bg: 'bg-amber-50', border: 'border-l-amber-400' },
  HOT_TOPIC: { icon: '🚨', bg: 'bg-red-50', border: 'border-l-coral' },
  NEW_PITCH: { icon: '💡', bg: 'bg-blue-50', border: 'border-l-blue-400' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(1),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="page-container pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold text-navy">🔔 Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-coral font-medium">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-sm text-gray-500 font-medium disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="🔕"
          title="No notifications yet"
          subtitle="Hot topic alerts and morning brief notifications will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif: any) => {
            const style = TYPE_STYLES[notif.type] || TYPE_STYLES.NEW_PITCH;
            return (
              <div
                key={notif._id}
                onClick={() => !notif.read && markReadMutation.mutate(notif._id)}
                className={`card border-l-4 ${style.border} ${style.bg} cursor-pointer active:scale-[0.98] transition-transform ${
                  !notif.read ? 'shadow-sm' : 'opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold text-sm text-navy leading-snug ${!notif.read ? '' : 'font-normal'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-coral rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
