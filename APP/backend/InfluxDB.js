import { InfluxDB } from '@influxdata/influxdb-client';

const token = 'gnqQ6h_WnjJlv1AtsXA9gVO8eDQDEhwTKvvGUJwhX-RMlpSRMUm9747tNpGpDPsgIQkl9-Q26dHy5kvdq4RIiA==';
const org = '4211097531c5837f';
const bucket = 'Prototipo Goodwe';
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';

const influxDB = new InfluxDB({ url, token });

async function getAllDataLastDays(dias) {
  const queryApi = influxDB.getQueryApi(org);
  
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -${dias}d)
      |> sort(columns: ["_time"], desc: false)
  `;

  const result = [];
  
  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        result.push(o);
      },
      error(error) {
        console.error('Erro na query:', error);
        reject(error);
      },
      complete() {
        console.log(`✅ ${result.length} registros recuperados`);
        resolve(result);
      }
    });
  });
}

async function getAllDataBetweenDates(startDate, endDate) {
  const queryApi = influxDB.getQueryApi(org);
  
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${startDate}, stop: ${endDate})
      |> sort(columns: ["_time"], desc: false)
  `;

  const result = [];
  
  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        result.push(o);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(result);
      }
    });
  });
}

async function getDataWithFilters(measurement, field, tags = {}, dias) {
  const queryApi = influxDB.getQueryApi(org);
  
  let filterString = `r._measurement == "${measurement}"`;
  
  if (field) {
    filterString += ` and r._field == "${field}"`;
  }
  
  Object.entries(tags).forEach(([key, value]) => {
    filterString += ` and r.${key} == "${value}"`;
  });
  
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -${dias}d)
      |> filter(fn: (r) => ${filterString})
      |> sort(columns: ["_time"], desc: false)
  `;

  const result = [];
  
  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        result.push(o);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(result);
      }
    });
  });
}

// NOVA FUNÇÃO: Busca todos os fields usando pivot para consolidar em um único registro
async function getAllFieldsFromMeasurement(measurement, tags = {}, dias) {
  const queryApi = influxDB.getQueryApi(org);
 
  let filterString = `r._measurement == "${measurement}"`;
 
  Object.entries(tags).forEach(([key, value]) => {
    filterString += ` and r.${key} == "${value}"`;
  });
 
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -${dias}d)
      |> filter(fn: (r) => ${filterString})
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"], desc: false)
  `;
  
  const result = [];
 
  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        result.push(o);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(result);
      }
    });
  });
}

// ALTERNATIVA: Se você quiser especificar quais fields retornar
async function getSpecificFieldsFromMeasurement(measurement, fields = [], tags = {}, dias) {
  const queryApi = influxDB.getQueryApi(org);
 
  let filterString = `r._measurement == "${measurement}"`;
  
  // Adiciona filtro de fields específicos se fornecido
  if (fields.length > 0) {
    const fieldsFilter = fields.map(f => `r._field == "${f}"`).join(' or ');
    filterString += ` and (${fieldsFilter})`;
  }
 
  Object.entries(tags).forEach(([key, value]) => {
    filterString += ` and r.${key} == "${value}"`;
  });
 
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -${dias}d)
      |> filter(fn: (r) => ${filterString})
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"], desc: false)
  `;
  
  const result = [];
 
  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        result.push(o);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(result);
      }
    });
  });
}

async function exemplos() {
  try {
    console.log('========================================');
    console.log('EXEMPLOS DE LEITURA');
    console.log('========================================\n');

    // Exemplo 1: Buscar últimos 30 dias (formato original - um field por linha)
    console.log('1️⃣ Buscando últimos 30 dias (formato original)...');
    const dados30dias = await getAllDataLastDays(30);
    console.log('Primeiros 3 registros:', dados30dias.slice(0, 3));
    console.log('');
    
    // Exemplo 2: Buscar entre datas
    console.log('2️⃣ Buscando entre datas específicas...');
    const dadosEntreDatas = await getAllDataBetweenDates(
      '2025-09-14T00:00:00Z',
      '2025-09-30T23:59:59Z'
    );
    console.log(`Total de registros: ${dadosEntreDatas.length}`);
    console.log('');

    // Exemplo 3: Buscar com filtros (field específico)
    console.log('3️⃣ Buscando com filtros...');
    const dadosFiltrados = await getDataWithFilters(
      'Ecalc_Wh',
      'Pdc',
      { week_day: 'saturday' },
      30
    );
    console.log(`Total de registros filtrados: ${dadosFiltrados.length}`);
    console.log('');

    // Exemplo 4: Buscar TODOS os fields consolidados com PIVOT
    console.log('4️⃣ Buscando com TODOS os fields (com pivot)...');
    const total_dados = await getAllFieldsFromMeasurement(
      'Ecalc_Wh',
      {},
      30
    );
    console.log(`Total de registros: ${total_dados.length}`);
    console.log('Primeiros 2 registros (com todos os fields):');
    console.log(JSON.stringify(total_dados.slice(0, 2), null, 2));
    console.log('');

    // Exemplo 5: Buscar apenas fields específicos
    console.log('5️⃣ Buscando fields específicos...');
    const dadosEspecificos = await getSpecificFieldsFromMeasurement(
      'Ecalc_Wh',
      ['Cbattery1', 'Pdc', 'Pac'], // Apenas esses fields
      {},
      30
    );
    console.log(`Total de registros: ${dadosEspecificos.length}`);
    console.log('Primeiros 2 registros:');
    console.log(JSON.stringify(dadosEspecificos.slice(0, 2), null, 2));
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro nos exemplos:', error);
  }
}

// Descomentar para testar:
exemplos();

export {
  getAllDataLastDays,
  getAllDataBetweenDates,
  getDataWithFilters,
  getAllFieldsFromMeasurement,
  getSpecificFieldsFromMeasurement
};