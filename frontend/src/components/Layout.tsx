import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  CubeIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Basic Form', href: '/forms/basic', icon: DocumentTextIcon },
    { name: 'Dynamic Dropdowns', href: '/forms/dynamic-dropdown', icon: CubeIcon },
    { name: 'Hierarchical Select', href: '/forms/hierarchical', icon: AdjustmentsHorizontalIcon },
    { name: 'Progressive Loading', href: '/forms/progressive-loading', icon: ArrowPathIcon },
    { name: 'Multi-page Form', href: '/forms/multi-page', icon: DocumentDuplicateIcon },
    { name: 'Complex Integration', href: '/forms/complex-integration', icon: BeakerIcon },
    { name: 'Workday Style', href: '/forms/workday-style', icon: BuildingOfficeIcon },
    { name: 'Greenhouse Style', href: '/forms/greenhouse-style', icon: BriefcaseIcon },
    { name: 'Lever Style', href: '/forms/lever-style', icon: WrenchScrewdriverIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Complex Forms Test</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
