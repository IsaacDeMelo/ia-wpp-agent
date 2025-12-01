
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ConnectionPanel from './components/ConnectionPanel';
import AIConfigPanel from './components/AIConfigPanel';
import ChatPlayground from './components/ChatPlayground';
import { ViewState, BotStatus, AIConfig, LogEntry, ModelType, DashboardStats } from './types';
import { Terminal, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('dashboard');
  const [botStatus, setBotStatus] = useState<BotStatus>(BotStatus.DISCONNECTED);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Real stats from server
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    messagesToday: 0,
    activeUsers: 0,
    costEstimate: 0,
    hourlyTraffic: [],
    uptime: 0
  });

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    model: ModelType.FLASH,
    temperature: 0.7,
    systemInstruction: '',
    isActive: true,
    allowedNumbers: [],
    onlyAllowed: true
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Initialize Real Socket Connection
  useEffect(() => {
    const newSocket = io(); 

    newSocket.on('connect', () => {
        addLog('Conectado ao servidor Backend', 'success');
    });

    newSocket.on('connect_error', () => {
        // Silent fail
    });

    newSocket.on('bot_status', (status: BotStatus) => {
        setBotStatus(status);
        if (status !== BotStatus.QR_READY) {
            setQrCodeData(null);
        }
    });

    newSocket.on('qr_code', (qr: string) => {
        setQrCodeData(qr);
        setBotStatus(BotStatus.QR_READY);
    });

    newSocket.on('log', (logEntry: any) => {
        addLog(logEntry.message, logEntry.level);
    });

    newSocket.on('config_initial', (config: AIConfig) => {
        setAiConfig(config);
    });
    
    // Recebe estatísticas completas
    newSocket.on('dashboard_update', (stats: DashboardStats) => {
        setDashboardStats(stats);
    });

    setSocket(newSocket);

    return () => {
        newSocket.close();
    };
  }, []);

  // Update backend when config changes
  const handleConfigUpdate = (newConfig: AIConfig) => {
    setAiConfig(newConfig);
    if (socket) {
        socket.emit('update_config', newConfig);
        addLog('Configurações enviadas ao servidor.', 'info');
    }
  };

  const addLog = (message: string, level: LogEntry['level']) => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      level,
      message
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard status={botStatus} stats={dashboardStats} />;
      case 'connection':
        return <ConnectionPanel status={botStatus} qrCodeData={qrCodeData} socket={socket} />;
      case 'configuration':
        return <AIConfigPanel config={aiConfig} setConfig={handleConfigUpdate} addLog={addLog} />;
      case 'playground':
        return <ChatPlayground config={aiConfig} status={botStatus} addLog={addLog} incrementMessageCount={() => {}} />;
      case 'logs':
        return (
          <div className="p-8 max-w-6xl mx-auto animate-fade-in">
             <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Terminal size={24} /> Logs do Sistema
             </h2>
             <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm h-[600px] overflow-y-auto shadow-2xl">
                {logs.length === 0 && <span className="text-slate-500">Nenhum log registrado ainda. Conecte ao servidor.</span>}
                {logs.map(log => (
                  <div key={log.id} className="mb-2 border-b border-slate-800 pb-1 last:border-0">
                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className={`font-bold ${
                      log.level === 'info' ? 'text-blue-400' : 
                      log.level === 'success' ? 'text-green-400' :
                      log.level === 'error' ? 'text-red-400' : 'text-yellow-400'
                    }`}>{log.level.toUpperCase()}:</span>{' '}
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))}
             </div>
          </div>
        );
      default:
        return <Dashboard status={botStatus} stats={dashboardStats} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar currentView={currentView} setView={setView} />
      
      <main className="flex-1 ml-64 relative">
         {!socket?.connected && (
           <div className="bg-amber-500 text-white p-2 text-center text-sm font-bold flex items-center justify-center gap-2">
             <AlertCircle size={16} />
             Desconectado do servidor. Tentando reconectar...
           </div>
         )}
        
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
