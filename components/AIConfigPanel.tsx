
import React from 'react';
import { AIConfig, ModelType } from '../types';
import { Save, Sparkles, BrainCircuit, ToggleLeft, ToggleRight, Shield, Phone, AlertTriangle } from 'lucide-react';

interface AIConfigPanelProps {
  config: AIConfig;
  setConfig: (config: AIConfig) => void;
  addLog: (msg: string, type: 'info'|'success') => void;
}

const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ config, setConfig, addLog }) => {
  
  const [localConfig, setLocalConfig] = React.useState<AIConfig>(config);
  const [numbersInput, setNumbersInput] = React.useState('');

  React.useEffect(() => {
    setLocalConfig(config);
    if (config.allowedNumbers) {
        setNumbersInput(config.allowedNumbers.join(', '));
    }
  }, [config]);

  const handleChange = (field: keyof AIConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const numbersArray = numbersInput
        .split(',')
        .map(n => n.trim().replace(/[^0-9]/g, ''))
        .filter(n => n.length > 8); // Validação básica de tamanho de número

    const finalConfig = {
        ...localConfig,
        allowedNumbers: numbersArray
    };

    setConfig(finalConfig);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cérebro do Bot (Gemini)</h2>
          <p className="text-slate-500">Configure como o Bot real responderá no WhatsApp.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-all shadow-lg shadow-green-500/20"
        >
          <Save size={20} />
          Salvar & Aplicar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <label className="flex items-center gap-2 font-bold text-slate-800 mb-4">
              <BrainCircuit size={20} className="text-purple-600" />
              Prompt do Sistema (Personalidade)
            </label>
            <textarea
              className="w-full h-48 p-4 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none resize-none font-mono text-sm bg-slate-50"
              value={localConfig.systemInstruction}
              onChange={(e) => handleChange('systemInstruction', e.target.value)}
              placeholder="Ex: Você é um assistente virtual..."
            ></textarea>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-4">
                <Shield size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800">Filtro de Contatos (Whitelist)</h3>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4">
                <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">Modo de Segurança</p>
                    <p className="text-xs text-slate-500 mt-1">
                        {localConfig.onlyAllowed 
                            ? "Ativado: O bot ignora qualquer número que não esteja na lista abaixo." 
                            : "Desativado: O bot responderá a QUALQUER mensagem recebida."}
                    </p>
                </div>
                <button 
                  onClick={() => handleChange('onlyAllowed', !localConfig.onlyAllowed)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      localConfig.onlyAllowed 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {localConfig.onlyAllowed ? "Apenas Whitelist" : "Todos os Contatos"}
                </button>
            </div>

            {localConfig.onlyAllowed && (
                <div className="animate-fade-in space-y-3">
                    <label className="text-sm font-medium text-slate-700 block">
                        Números Permitidos
                    </label>
                    
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                        <textarea 
                            value={numbersInput}
                            onChange={(e) => setNumbersInput(e.target.value)}
                            className="w-full pl-10 p-3 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none h-24 font-mono"
                            placeholder="5511999998888, 5521999997777"
                        />
                    </div>
                    
                    <div className="flex gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                        <AlertTriangle size={16} className="shrink-0" />
                        <p>
                            <strong>Importante:</strong> Digite apenas números (sem + ou -). 
                            Inclua o código do país (55 para Brasil) e DDD. 
                            Exemplo: <strong>5511987654321</strong>.
                        </p>
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6">Parâmetros do Modelo</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Modelo Gemini</label>
              <div className="space-y-2">
                <button 
                  onClick={() => handleChange('model', ModelType.FLASH)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border ${localConfig.model === ModelType.FLASH ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="text-left">
                    <span className="block font-bold text-sm">Gemini 2.5 Flash</span>
                    <span className="text-xs opacity-70">Rápido e econômico</span>
                  </div>
                  {localConfig.model === ModelType.FLASH && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                </button>
                <button 
                  onClick={() => handleChange('model', ModelType.PRO)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border ${localConfig.model === ModelType.PRO ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="text-left">
                    <span className="block font-bold text-sm">Gemini 3 Pro</span>
                    <span className="text-xs opacity-70">Raciocínio complexo</span>
                  </div>
                  {localConfig.model === ModelType.PRO && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Criatividade: {localConfig.temperature}</label>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={localConfig.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-slate-800">IA Ativa</label>
                  <span className="text-xs text-slate-500">Mestre Switch</span>
                </div>
                <button 
                  onClick={() => handleChange('isActive', !localConfig.isActive)}
                  className={`text-2xl transition-colors ${localConfig.isActive ? 'text-green-600' : 'text-slate-300'}`}
                >
                  {localConfig.isActive ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigPanel;
