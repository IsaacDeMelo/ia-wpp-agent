
/**
 * ZAPBOT AI MANAGER - SERVER (Production Ready)
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

// Configuração de Caminhos (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivos de Persistência
const DATA_DIR = path.join(__dirname, '.data');
if (!fs.existsSync(DATA_DIR)){
    try {
        fs.mkdirSync(DATA_DIR);
    } catch(e) {
        console.error("Erro ao criar diretório .data:", e);
    }
}
const CONFIG_FILE = path.join(DATA_DIR, 'bot_config.json');
const STATS_FILE = path.join(DATA_DIR, 'bot_stats.json');

// --- CONFIGURAÇÃO ---
const app = express();
app.use(cors());

// Servir arquivos estáticos do React (Frontend buildado)
app.use(express.static(path.join(__dirname, 'dist')));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Inicializa Gemini AI
const apiKey = process.env.API_KEY;
let ai = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey });
} else {
    console.error("ERRO CRÍTICO: API_KEY não encontrada no .env");
}

// --- ESTADO DO BOT (Com Persistência) ---

// Configuração Padrão
let botConfig = {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    systemInstruction: 'Você é um assistente útil. Responda de forma curta e natural.',
    isActive: true,
    allowedNumbers: [], // Lista de strings (apenas números, sem @c.us)
    onlyAllowed: true   // Padrão TRUE para segurança
};

// Carregar Config
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        botConfig = { ...botConfig, ...savedConfig };
        console.log('Configurações carregadas do disco.');
    } catch (e) {
        console.error('Erro ao ler config:', e);
    }
}

// Estatísticas Padrão
let botStats = {
    messagesToday: 0,
    uniqueUsers: [], // Set não serializa em JSON, usando Array
    tokenUsageEst: 0,
    startTime: Date.now(),
    hourlyTraffic: Array(24).fill(0)
};

// Carregar Stats
if (fs.existsSync(STATS_FILE)) {
    try {
        const savedStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
        // Mesclar dados
        botStats = { ...botStats, ...savedStats };
        // Resetar startTime para o boot atual
        botStats.startTime = Date.now();
        console.log('Estatísticas carregadas do disco.');
    } catch (e) {
        console.error('Erro ao ler stats:', e);
    }
}

// Sets auxiliares em memória
let uniqueUsersSet = new Set(botStats.uniqueUsers);

// Função para Salvar Dados
const saveState = () => {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
        
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(botConfig, null, 2));
        
        // Converter Set para Array antes de salvar
        const statsToSave = {
            ...botStats,
            uniqueUsers: Array.from(uniqueUsersSet)
        };
        fs.writeFileSync(STATS_FILE, JSON.stringify(statsToSave, null, 2));
    } catch (e) {
        console.error('Erro ao salvar estado:', e);
    }
};

// --- ESTRATÉGIAS ANTI-BAN ---
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const messageQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;

    const { message, chat, responseText } = messageQueue.shift();

    try {
        // Delay Humano (2-5s)
        await new Promise(r => setTimeout(r, randomDelay(2000, 5000)));

        // Simula Digitação
        await chat.sendStateTyping();
        const typingTime = Math.min(responseText.length * 50, 10000); 
        await new Promise(r => setTimeout(r, Math.max(3000, typingTime)));

        // Envia
        await message.reply(responseText);
        await chat.clearState();
        
        console.log('Mensagem enviada (Anti-Ban OK).');
    } catch (error) {
        console.error('Erro fila:', error);
    } finally {
        isProcessingQueue = false;
        setTimeout(processQueue, randomDelay(1000, 3000));
    }
};

const broadcastStats = () => {
    // Formata dados para o gráfico
    const graphData = botStats.hourlyTraffic.map((count, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count
    }));

    const payload = {
        messagesToday: botStats.messagesToday,
        activeUsers: uniqueUsersSet.size,
        costEstimate: (botStats.tokenUsageEst / 1000000) * 0.10, 
        hourlyTraffic: graphData,
        uptime: Math.floor((Date.now() - botStats.startTime) / 1000)
    };

    io.emit('dashboard_update', payload);
};


// --- WHATSAPP CLIENT ---

// Detecção de Executável do Chrome
// Prioridade: ENV Variable > Docker Path Stable > Docker Path Generic > Local Fallback
let puppeteerExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

if (!puppeteerExecutablePath) {
    if (fs.existsSync('/usr/bin/google-chrome-stable')) {
        puppeteerExecutablePath = '/usr/bin/google-chrome-stable';
    } else if (fs.existsSync('/usr/bin/google-chrome')) {
        puppeteerExecutablePath = '/usr/bin/google-chrome';
    }
}

console.log(`Iniciando Puppeteer com executável: ${puppeteerExecutablePath || 'Padrão (Local)'}`);

// Configuração de Argumentos Puppeteer
const puppeteerArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-features=VizDisplayCompositor',
    '--no-zygote',
    '--single-process',
    '--disable-features=IsolateOrigins',
    '--disable-features=site-per-process'
];


const whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
    puppeteer: {
        executablePath: puppeteerExecutablePath,
        args: puppeteerArgs,
        headless: true,                  // obrigatório no docker
        dumpio: false,                   // evita travamentos
        ignoreHTTPSErrors: true          // chrome fecha sem isso às vezes
    }
});

// --- EVENTOS DO WHATSAPP ---

whatsappClient.on('qr', (qr) => {
    console.log('NOVO QR CODE GERADO');
    io.emit('qr_code', qr);
    io.emit('bot_status', 'QR_READY');
});

whatsappClient.on('ready', () => {
    console.log('WhatsApp Ready!');
    io.emit('bot_status', 'CONNECTED');
    io.emit('log', { level: 'success', message: 'WhatsApp conectado!', timestamp: new Date() });
});

whatsappClient.on('authenticated', () => {
    console.log('Autenticado com sucesso');
    io.emit('log', { level: 'info', message: 'Sessão autenticada restaurada.', timestamp: new Date() });
});

whatsappClient.on('auth_failure', (msg) => {
    console.error('Falha na autenticação', msg);
    io.emit('log', { level: 'error', message: `Falha de autenticação: ${msg}`, timestamp: new Date() });
});

whatsappClient.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
    io.emit('bot_status', 'DISCONNECTED');
    io.emit('log', { level: 'warning', message: `Desconectado: ${reason}`, timestamp: new Date() });
});

whatsappClient.on('message', async (message) => {
    // Ignora grupos e status
    if (message.from.includes('@g.us') || message.isStatus) return;
    
    // Normaliza número (remove @c.us)
    const senderNumber = message.from.replace('@c.us', '');

    if (!botConfig.isActive) return;

    // --- WHITELIST CHECK ---
    if (botConfig.onlyAllowed) {
        // Verifica se o número está na lista
        if (!botConfig.allowedNumbers.includes(senderNumber)) {
            return; 
        }
    }

    // Atualiza Stats Reais
    const currentHour = new Date().getHours();
    botStats.messagesToday++;
    uniqueUsersSet.add(senderNumber);
    botStats.hourlyTraffic[currentHour] = (botStats.hourlyTraffic[currentHour] || 0) + 1;
    saveState(); // Persiste no disco
    broadcastStats(); // Atualiza UI

    const contact = await message.getContact();
    const senderName = contact.pushname || contact.name || senderNumber;
    
    io.emit('log', { level: 'info', message: `Msg de ${senderName}: "${message.body.substring(0, 20)}..."`, timestamp: new Date() });

    if (!ai) return;

    try {
        const chat = await message.getChat();
        
        // Simular leitura
        await chat.sendSeen();

        const response = await ai.models.generateContent({
            model: botConfig.model,
            contents: message.body,
            config: {
                systemInstruction: botConfig.systemInstruction,
                temperature: botConfig.temperature,
            }
        });

        const replyText = response.text;
        
        botStats.tokenUsageEst += (message.body.length + replyText.length) * 0.25;
        saveState();

        if (replyText) {
            messageQueue.push({ message, chat, responseText: replyText });
            processQueue(); 
        }

    } catch (error) {
        console.error('Erro IA:', error);
        io.emit('log', { level: 'error', message: `Erro IA: ${error.message}`, timestamp: new Date() });
    }
});


// --- SOCKET.IO ---

io.on('connection', (socket) => {
    console.log('Frontend conectado via Socket');
    
    socket.emit('config_initial', botConfig);
    broadcastStats();
    
    // Envia status atual se já estiver conectado
    if (whatsappClient.info) {
        socket.emit('bot_status', 'CONNECTED');
    }

    socket.on('update_config', (newConfig) => {
        botConfig = { ...botConfig, ...newConfig };
        saveState();
        console.log('Config atualizada:', botConfig.allowedNumbers);
        io.emit('log', { level: 'info', message: 'Configurações salvas e aplicadas.', timestamp: new Date() });
    });

    socket.on('restart_client', async () => {
        io.emit('log', { level: 'warning', message: 'Reiniciando processo do WhatsApp...', timestamp: new Date() });
        try { 
            await whatsappClient.destroy(); 
        } catch(e) {
            console.error('Erro ao destruir cliente:', e);
        }
        whatsappClient.initialize();
    });

    socket.on('disconnect_session', async () => {
        try { await whatsappClient.logout(); } catch(e) {}
        io.emit('bot_status', 'DISCONNECTED');
    });
});

// Inicialização com tratamento de erro
try {
    whatsappClient.initialize();
} catch (e) {
    console.error('Erro fatal ao inicializar WhatsApp Client:', e);
}

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
