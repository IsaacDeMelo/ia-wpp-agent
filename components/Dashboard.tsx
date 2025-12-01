
import React from 'react';
import { BotStatus, DashboardStats } from '../types';
import { Activity, Users, MessageCircle, Zap, TrendingUp, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  status: BotStatus;
  stats: DashboardStats;
}

const StatCard: React.FC<{ title: string; value: string; sub: string; icon: any; color: string }> = ({ title, value, sub, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between transition-transform hover:scale-[1.02]">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      <p className={`text-xs font-medium mt-2 ${sub.includes('Real') ? 'text-green-600' : 'text-slate-400'}`}>
        {sub}
      </p>
    </div>
    <div className={`p-3 rounded-xl ${color} text-white shadow-lg shadow-indigo-50`}>
      <Icon size={24} />
    </div>
  </div>
);

const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
};

const Dashboard: React.FC<DashboardProps> = ({ status, stats }) => {
  
  // Prepare data for chart (Only show hours with traffic or range around current time)
  const chartData = stats.hourlyTraffic.map(item => ({
      name: item.hour,
      messages: item.count
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500">Dados em tempo real do seu assistente WhatsApp.</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border ${
          status === BotStatus.CONNECTED 
            ? 'bg-green-100 text-green-700 border-green-200' 
            : 'bg-red-100 text-red-700 border-red-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${status === BotStatus.CONNECTED ? 'bg-green-600' : 'bg-red-600'}`}></span>
          {status === BotStatus.CONNECTED ? 'Bot Online' : 'Bot Offline'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Mensagens Hoje" 
          value={stats.messagesToday.toString()} 
          sub="Tempo Real" 
          icon={MessageCircle} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Usuários Únicos" 
          value={stats.activeUsers.toString()} 
          sub="Interações do dia" 
          icon={Users} 
          color="bg-purple-600" 
        />
        <StatCard 
          title="Custo Estimado" 
          value={`$ ${stats.costEstimate.toFixed(4)}`} 
          sub="Baseado em tokens" 
          icon={Zap} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Uptime Sessão" 
          value={formatTime(stats.uptime)} 
          sub="Desde o início" 
          icon={Clock} 
          color="bg-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">Tráfego por Hora (24h)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8'}} 
                    interval={3} // Show every 3rd label to avoid clutter
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="messages" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Status da API Node.js</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Fila de Mensagens</span>
                <span className="font-medium text-green-600">Vazia</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-[2%]"></div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 mt-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <TrendingUp size={20} className="text-green-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Anti-Ban Ativo</p>
                  <p className="text-xs text-slate-500">Delays variáveis aplicados.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                 <p className="text-xs text-amber-800 font-semibold mb-1">Nota de Desenvolvimento</p>
                 <p className="text-xs text-amber-700">
                    Os dados são mantidos em memória RAM. Se o servidor Render reiniciar (deploy ou inatividade), as estatísticas do dia zeram.
                 </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
