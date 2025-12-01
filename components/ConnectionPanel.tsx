import React from 'react';
import { BotStatus } from '../types';
import { RefreshCw, Smartphone, CheckCircle, AlertTriangle, LogOut, Server } from 'lucide-react';

interface ConnectionPanelProps {
  status: BotStatus;
  qrCodeData: string | null;
  socket: any;
}

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ status, qrCodeData, socket }) => {

  const handleDisconnect = () => {
    if (socket) {
      socket.emit('disconnect_session');
    }
  };

  const handleRestart = () => {
    if (socket) {
      socket.emit('restart_client');
    }
  };

  // Convert text QR to Image URL API (Google API or QRServer) for rendering
  // whatsapp-web.js emits a text string, we need to visualize it.
  const qrImageUrl = qrCodeData 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`
    : null;

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center animate-fade-in">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Conectar WhatsApp</h2>
        <p className="text-slate-500 mb-8">Gerencie a conexão do servidor Node.js com o WhatsApp.</p>

        {status === BotStatus.CONNECTED ? (
          <div className="flex flex-col items-center py-10">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-700 mb-2">Bot Conectado!</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              O serviço backend está ativo e processando mensagens reais via <code>whatsapp-web.js</code>.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={handleRestart}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-medium transition-colors"
              >
                <RefreshCw size={20} />
                Reiniciar Serviço
              </button>
              <button 
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium transition-colors"
              >
                <LogOut size={20} />
                Sair da Sessão
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
             <div className="relative group">
               {status === BotStatus.CONNECTING && (
                 <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 backdrop-blur-sm rounded-2xl">
                   <div className="flex flex-col items-center">
                     <RefreshCw className="animate-spin text-green-600 mb-2" size={32} />
                     <span className="text-sm font-semibold text-slate-600">Autenticando...</span>
                   </div>
                 </div>
               )}
               
               <div className="border-4 border-slate-900 rounded-2xl p-4 bg-white shadow-inner min-h-[300px] min-w-[300px] flex items-center justify-center">
                  {status === BotStatus.QR_READY && qrImageUrl ? (
                     <img 
                       src={qrImageUrl} 
                       alt="QR Code Real" 
                       className="w-64 h-64 object-contain rounded-lg"
                     />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                        {status === BotStatus.DISCONNECTED ? (
                            <>
                                <Server size={48} className="mb-2 opacity-50" />
                                <span className="text-sm">Servidor Desconectado ou Aguardando...</span>
                                <button onClick={handleRestart} className="mt-4 text-blue-600 underline text-sm">Iniciar Bot</button>
                            </>
                        ) : (
                            <div className="animate-pulse">Gerando QR Code...</div>
                        )}
                    </div>
                  )}
               </div>
             </div>

             <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-lg">
                  <Smartphone size={16} />
                  <span>Abra o WhatsApp {'>'} Configurações {'>'} Aparelhos conectados</span>
                </div>
             </div>
          </div>
        )}
        
        {/* Connection status indicator for Socket.io */}
        <div className="mt-6 text-xs text-slate-400">
           Status do Socket: {socket?.connected ? <span className="text-green-500 font-bold">Conectado ao Backend</span> : <span className="text-red-500 font-bold">Sem conexão com server.js</span>}
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel;