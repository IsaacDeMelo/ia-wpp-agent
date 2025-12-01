import React from 'react';
import { LayoutDashboard, QrCode, Settings, MessageSquare, Terminal, Bot } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'connection', label: 'Conexão', icon: QrCode },
    { id: 'configuration', label: 'Configuração IA', icon: Settings },
    { id: 'playground', label: 'Testar Bot', icon: MessageSquare },
    { id: 'logs', label: 'Logs do Sistema', icon: Terminal },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-green-500 p-2 rounded-lg">
          <Bot size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">ZapBot Admin</h1>
          <p className="text-xs text-slate-400">v1.0.0 (Gemini Powered)</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-green-600 text-white shadow-lg shadow-green-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Status da API</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-green-400">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;