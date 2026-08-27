import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { RightRail } from './RightRail';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { CommandPalette } from '../search/CommandPalette';
import { FloatingChatDrawer } from '../chat/FloatingChatDrawer';
import { useAuth } from '../../context/AuthContext';

interface AppShellProps {
  showSidebars?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ showSidebars = true }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine if this is a full-width page
  const isFeedPage = location.pathname === '/feed' || location.pathname === '/home';
  const isNetworkPage = location.pathname === '/network';

  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors pb-16 md:pb-0">
      {/* Top Navigation */}
      <Navbar onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isAuthenticated && showSidebars ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Rail */}
            <div className="hidden md:block md:col-span-4 lg:col-span-3 sticky top-20">
              <Sidebar />
            </div>

            {/* Central Main Content */}
            <div
              className={`col-span-1 md:col-span-8 ${
                isFeedPage || isNetworkPage ? 'lg:col-span-6' : 'lg:col-span-9'
              }`}
            >
              <Outlet />
            </div>

            {/* Right Rail */}
            {(isFeedPage || isNetworkPage) && (
              <div className="hidden lg:block lg:col-span-3 sticky top-20">
                <RightRail />
              </div>
            )}
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Floating Chat Drawer */}
      {isAuthenticated && <FloatingChatDrawer />}
    </div>
  );
};
