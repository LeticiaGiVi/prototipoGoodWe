import express from 'express';
import cors from 'cors';
import { 
  getAllDataLastDays, 
  getAllDataBetweenDates, 
  getDataWithFilters,
  getAllFieldsFromMeasurement,
  getSpecificFieldsFromMeasurement 
} from './InfluxDB.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ==================== ROTAS PRINCIPAIS ====================

// Rota de saúde da API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API InfluxDB está funcionando',
    timestamp: new Date().toISOString()
  });
});

// ==================== DADOS TEMPORAIS ====================

// 1. Buscar dados dos últimos N dias
app.get('/api/data/last-days/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days);
    
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parâmetro days deve ser um número positivo' 
      });
    }

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
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 2. Buscar dados entre datas específicas
app.get('/api/data/between-dates', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parâmetros start e end são obrigatórios (formato ISO: 2025-01-01T00:00:00Z)' 
      });
    }

    console.log(`📅 Buscando dados de ${start} até ${end}...`);
    const data = await getAllDataBetweenDates(start, end);
    
    res.json({ 
      success: true, 
      data,
      summary: {
        totalRecords: data.length,
        startDate: start,
        endDate: end,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro na rota /between-dates:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== DADOS FILTRADOS ====================

// 3. Buscar dados com filtros avançados
app.get('/api/data/filtered', async (req, res) => {
  try {
    const { measurement, field, tags, days, device, type } = req.query;
    
    if (!measurement) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parâmetro measurement é obrigatório' 
      });
    }

    let parsedTags = {};
    
    // Processar tags do query string
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        return res.status(400).json({ 
          success: false, 
          error: 'Formato inválido para tags. Use JSON válido.' 
        });
      }
    }
    
    // Adicionar filtros de device e type se fornecidos
    if (device) parsedTags.device = device;
    if (type) parsedTags.type = type;

    const daysToQuery = parseInt(days) || 7;

    console.log(`🔍 Buscando dados filtrados:`, { 
      measurement, 
      field, 
      tags: parsedTags, 
      days: daysToQuery 
    });
    
    const data = await getDataWithFilters(
      measurement, 
      field, 
      parsedTags, 
      daysToQuery
    );
    
    res.json({ 
      success: true, 
      data,
      summary: {
        totalRecords: data.length,
        measurement,
        field,
        tags: parsedTags,
        period: `${daysToQuery} dias`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro na rota /filtered:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== MEASUREMENTS E FIELDS ====================

// 4. Buscar todos os fields de uma measurement (com pivot)
app.get('/api/measurement/fields/:measurement', async (req, res) => {
  try {
    const { measurement } = req.params;
    const { days, tags } = req.query;
    
    let parsedTags = {};
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        return res.status(400).json({ 
          success: false, 
          error: 'Formato inválido para tags. Use JSON válido.' 
        });
      }
    }

    const daysToQuery = parseInt(days) || 7;

    console.log(`📦 Buscando todos os fields da measurement ${measurement}...`);
    const data = await getAllFieldsFromMeasurement(
      measurement,
      parsedTags,
      daysToQuery
    );
    
    // Extrair lista de fields disponíveis do primeiro registro
    const availableFields = data.length > 0 
      ? Object.keys(data[0]).filter(key => 
          !['_time', '_measurement', 'result', 'table'].includes(key)
        )
      : [];
    
    res.json({ 
      success: true, 
      data,
      summary: {
        totalRecords: data.length,
        measurement,
        availableFields,
        period: `${daysToQuery} dias`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro na rota /measurement/fields:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 5. Buscar fields específicos de uma measurement
app.get('/api/measurement/specific-fields/:measurement', async (req, res) => {
  try {
    const { measurement } = req.params;
    const { fields, days, tags } = req.query;
    
    if (!fields) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parâmetro fields é obrigatório (formato: field1,field2,field3)' 
      });
    }

    const fieldsArray = fields.split(',').map(f => f.trim());
    
    let parsedTags = {};
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        return res.status(400).json({ 
          success: false, 
          error: 'Formato inválido para tags. Use JSON válido.' 
        });
      }
    }

    const daysToQuery = parseInt(days) || 7;

    console.log(`📊 Buscando fields específicos de ${measurement}:`, fieldsArray);
    const data = await getSpecificFieldsFromMeasurement(
      measurement,
      fieldsArray,
      parsedTags,
      daysToQuery
    );
    
    res.json({ 
      success: true, 
      data,
      summary: {
        totalRecords: data.length,
        measurement,
        requestedFields: fieldsArray,
        period: `${daysToQuery} dias`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro na rota /measurement/specific-fields:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== ENDPOINTS DE CONVENIÊNCIA ====================

// 6. Buscar dados de sub-metering (para o menu lateral)
app.get('/api/devices/sub-metering', async (req, res) => {
  try {
    const { days } = req.query;
    const daysToQuery = parseInt(days) || 1;
    
    console.log(`🔌 Buscando dados de sub-metering...`);
    
    // Buscar dados das últimas 24h com todos os sub_metering
    const data = await getAllFieldsFromMeasurement(
      'Ecalc_Wh',
      {},
      daysToQuery
    );
    
    // Processar dados para obter resumo dos dispositivos
    const devices = [];
    
    // Identificar quais sub_metering existem
    if (data.length > 0) {
      const sampleRecord = data[0];
      const subMeteringFields = Object.keys(sampleRecord).filter(key => 
        key.startsWith('sub_metering_')
      );
      
      subMeteringFields.forEach(field => {
        const deviceNumber = field.split('_')[2];
        const deviceData = data
          .filter(d => d[field] !== undefined && d[field] !== null)
          .map(d => ({ time: d._time, value: d[field] }));
        
        const totalConsumption = deviceData.reduce((sum, d) => sum + (d.value || 0), 0);
        const avgConsumption = deviceData.length > 0 ? totalConsumption / deviceData.length : 0;
        
        devices.push({
          id: deviceNumber,
          name: `Dispositivo ${deviceNumber}`,
          field: field,
          totalConsumption: totalConsumption.toFixed(2),
          avgConsumption: avgConsumption.toFixed(2),
          unit: 'Wh',
          status: deviceData.length > 0 ? 'active' : 'inactive'
        });
      });
    }
    
    res.json({ 
      success: true, 
      devices,
      summary: {
        totalDevices: devices.length,
        period: `${daysToQuery} dia(s)`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro na rota /devices/sub-metering:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== ROTA RAIZ ====================

app.get('/', (req, res) => {
  res.json({ 
    message: 'Bem-vindo à API do InfluxDB',
    version: '2.0',
    endpoints: {
      health: {
        url: '/api/health',
        description: 'Verificar status da API'
      },
      data: {
        lastDays: {
          url: '/api/data/last-days/:days',
          description: 'Dados dos últimos X dias',
          example: '/api/data/last-days/7'
        },
        betweenDates: {
          url: '/api/data/between-dates?start=...&end=...',
          description: 'Dados entre datas específicas',
          example: '/api/data/between-dates?start=2025-01-01T00:00:00Z&end=2025-01-31T23:59:59Z'
        },
        filtered: {
          url: '/api/data/filtered?measurement=...&field=...&days=...',
          description: 'Dados filtrados por measurement, field e tags',
          example: '/api/data/filtered?measurement=Ecalc_Wh&field=Pdc&days=7'
        }
      },
      measurement: {
        allFields: {
          url: '/api/measurement/fields/:measurement',
          description: 'Todos os fields de uma measurement (com pivot)',
          example: '/api/measurement/fields/Ecalc_Wh?days=7'
        },
        specificFields: {
          url: '/api/measurement/specific-fields/:measurement?fields=...',
          description: 'Fields específicos de uma measurement',
          example: '/api/measurement/specific-fields/Ecalc_Wh?fields=Pdc,Pac,Cbattery1&days=7'
        }
      },
      devices: {
        subMetering: {
          url: '/api/devices/sub-metering',
          description: 'Lista de dispositivos sub-metering',
          example: '/api/devices/sub-metering?days=1'
        }
      }
    }
  });
});

// ==================== INICIALIZAÇÃO ====================

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API InfluxDB v2.0 disponível:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://localhost:${PORT}/api/health`);
  console.log('========================================\n');
});