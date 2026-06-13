import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';

const navItems = [
  { to: '/', icon: '🏠', label: 'Home', exact: true },
  { to: '/trending', icon: '🔥', label: 'Trending', exact: false },
  { to: '/morning-brief', icon: '☀️', label: 'Brief', exact: false },
  { to: '/saved', icon: '💾', label: 'Saved', exact: false },
  { to: '/notifications', icon: '🔔', label: 'Alerts', exact: false },
];

export default function Layout() {
  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.getAll(1),
    refetchInterval: 60000, // refresh every minute
  });

  const unreadCount = notifData?.unreadCount || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-navy text-white px-4 pt-safe pb-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <span className="font-bold text-base">EPA</span>
          </div>
          <NavLink to="/settings" className="text-white/70 text-sm">⚙️</NavLink>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-10">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative ${
                  isActive ? 'text-coral' : 'text-gray-400'
                }`
              }
            >
              <span className="text-xl leading-none">
                {item.label === 'Alerts' && unreadCount > 0 ? (
                  <span className="relative inline-block">
                    {item.icon}
                    <span className="absolute -top-1 -right-1 bg-coral text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                ) : item.icon}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
