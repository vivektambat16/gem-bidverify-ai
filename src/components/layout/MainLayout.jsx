import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '../../context/SidebarContext';
import { BackendStatus } from './BackendStatus';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const MainLayout = () => (
  <SidebarProvider>
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800">
      <BackendStatus />
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto custom-scrollbar transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  </SidebarProvider>
);
