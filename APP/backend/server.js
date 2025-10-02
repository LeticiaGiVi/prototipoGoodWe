import express from 'express';
import cors from 'cors';
import { getAllDataLastDays, getAllDataBetweenDates, getDataWithFilters } from './InfluxDB.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 🔥 CORREÇÃO: Remover o ? da definição do parâmetro
// Rota para buscar dados dos últimos dias - parâmetro obrigatório
app.get('/api/data/last-days/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    console.log(`📊 Buscando dados dos últimos ${days} dias...`);
    const data = await getAllDataLastDays(days);
    res.json({ 
      success: true, 
      data,
      summary: {
        totalRecords: data.length,
        period: `${days} dias`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro na rota /last-days:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 NOVA ROTA: Para dias opcionais (sem parâmetro)
app.get('/api/data/last-days', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30; // Agora usa query parameter
    console.log(`📊 Buscando dados dos últimos ${days} dias...`);
    const data = await getAllDataLastDays(days);
    res.json({ 
      success: true, 
      data,
      summary: {
        totalRecords: data.length,
        period: `${days} dias`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro na rota /last-days:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para buscar entre datas
app.get('/api/data/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'startDate e endDate são obrigatórios' 
      });
    }

    console.log(`📅 Buscando dados de ${startDate} até ${endDate}...`);
    const data = await getAllDataBetweenDates(startDate, endDate);
    
    res.json({ 
      success: true, 
      data,
      summary: {
        totalRecords: data.length,
        startDate,
        endDate,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro na rota /range:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para dados filtrados
app.get('/api/data/filtered', async (req, res) => {
  try {
    const { measurement, field, tags, days } = req.query;
    
    let parsedTags = {};
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        return res.status(400).json({ 
          success: false, 
          error: 'Formato inválido para tags. Use JSON.' 
        });
      }
    }

    console.log(`🔍 Buscando dados filtrados:`, { measurement, field, parsedTags, days });
    const data = await getDataWithFilters(measurement, field, parsedTags, parseInt(days) || 7);
    
    res.json({ 
      success: true, 
      data,
      summary: {
        totalRecords: data.length,
        measurement,
        field,
        tags: parsedTags,
        period: `${days || 7} dias`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro na rota /filtered:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota de saúde da API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API InfluxDB está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bem-vindo à API do InfluxDB',
    endpoints: {
      '/api/health': 'Verificar status da API',
      '/api/data/last-days': 'Dados dos últimos dias (query: ?days=7)',
      '/api/data/last-days/:days': 'Dados dos últimos X dias',
      '/api/data/range': 'Dados entre datas (?startDate=...&endDate=...)',
      '/api/data/filtered': 'Dados filtrados'
    }
  });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API InfluxDB disponível:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://localhost:${PORT}/api/health`);
  console.log('========================================\n');
});