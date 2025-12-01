
export enum BotStatus {
  DISCONNECTED = 'DISCONNECTED',
  QR_READY = 'QR_READY',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
}

export interface AIConfig {
  model: ModelType;
  temperature: number;
  systemInstruction: string;
  isActive: boolean;
  // Novos campos de segurança
  allowedNumbers: string[]; // Lista de números permitidos (ex: '551199999999')
  onlyAllowed: boolean;     // Se true, responde apenas à whitelist
}

export interface DashboardStats {
  messagesToday: number;
  activeUsers: number;
  costEstimate: number;
  hourlyTraffic: { hour: string; count: number }[];
  uptime: number; // segundos
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export type ViewState = 'dashboard' | 'connection' | 'configuration' | 'playground' | 'logs';
