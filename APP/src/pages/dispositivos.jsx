import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dispositivos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/measurement/fields/Ecalc_Wh?days=${selectedDays}`);
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('📊 Dados recebidos da API:', result);
      console.log('📦 Primeiro registro:', result.data?.[0]);
      
      if (result.success && result.data && result.data.length > 0) {
        const lastRecord = result.data[result.data.length - 1];
        console.log('✅ Último registro:', lastRecord);
        setData(lastRecord);
      } else {
        throw new Error('Nenhum dado encontrado');
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedDays]);

  const getCardColor = (consumption, isOn) => {
    if (!isOn) return 'bg-gray-100 border-gray-300';
    if (consumption === 0) return 'bg-green-50 border-green-200';
    if (consumption <= 100) return 'bg-blue-50 border-blue-200';
    if (consumption <= 500) return 'bg-yellow-50 border-yellow-200';
    return 'bg-orange-50 border-orange-200';
  };

  const getStatusColor = (isOn) => {
    return isOn ? 'text-green-600' : 'text-gray-500';
  };

  const getSolarBadgeColor = (isOn) => {
    return isOn ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  const DeviceCard = ({ deviceNum, consumption, isOn }) => (
    <Link 
      to={`/dispositivos/${deviceNum}`}
      className={`block border-2 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer ${getCardColor(consumption, isOn)}`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Dispositivo {deviceNum}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSolarBadgeColor(isOn)}`}>
          {isOn ? '🌞 Solar' : '⚡ Rede'}
        </span>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {consumption !== undefined && consumption !== null ? consumption.toFixed(2) : 'N/A'}
        </div>
        <div className="text-sm text-gray-600">Watts-hora (Wh)</div>
      </div>

      <div className="flex justify-between items-center text-sm mb-3">
        <span className="text-gray-600">Status:</span>
        <span className={`font-medium ${getStatusColor(isOn)}`}>
          {isOn ? '🔌 Conectado' : '🔴 Desligado'}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <span className="text-xs text-blue-600 font-medium flex items-center justify-center">
          Clique para ver detalhes →
        </span>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Monitoramento de Dispositivos
        </h1>
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados dos dispositivos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Monitoramento de Dispositivos
        </h1>
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <div className="text-red-600 text-4xl mb-2">⚠️</div>
              <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar dados</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Nomes corretos das colunas (com S maiúsculo)
  const totalConsumption = (
    (data?.Sub_metering_1 || 0) + 
    (data?.Sub_metering_2 || 0) + 
    (data?.Sub_metering_3 || 0)
  );

  const activeDevices = [data?.Sub1_on, data?.Sub2_on, data?.Sub3_on].filter(Boolean).length;
  const solarDevices = [data?.Sub1_on, data?.Sub2_on, data?.Sub3_on].filter(Boolean).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Monitoramento de Dispositivos
          </h1>
          <p className="text-gray-600">
            Clique em qualquer dispositivo para ver detalhes e histórico
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value={1}>Últimas 24h</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={15}>Últimos 15 dias</option>
            <option value={30}>Últimos 30 dias</option>
          </select>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-700">
            <span className="font-medium">Última atualização:</span>
            <span className="font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded border">
              {data?.time ? new Date(data.time).toLocaleString('pt-BR') : 
               data?._time ? new Date(data._time).toLocaleString('pt-BR') : 'N/A'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600 text-lg">●</span>
            <span className="text-gray-600">Atualização automática a cada 30s</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-gray-600 mb-1 text-sm font-medium">Dispositivos Ativos</div>
          <div className="text-3xl font-bold text-gray-900">
            {activeDevices} / 3
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {activeDevices === 3 ? '✅ Todos ativos' : `⚠️ ${3 - activeDevices} inativo(s)`}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-gray-600 mb-1 text-sm font-medium">Usando Energia Solar</div>
          <div className="text-3xl font-bold text-green-600">
            {solarDevices} / 3
          </div>
          <div className="mt-2 text-xs text-gray-500">
            🌞 {((solarDevices / 3) * 100).toFixed(0)}% de uso solar
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-gray-600 mb-1 text-sm font-medium">Consumo Total</div>
          <div className="text-3xl font-bold text-blue-600">
            {totalConsumption.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-gray-500">Wh no período</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DeviceCard 
          deviceNum={1}
          consumption={data?.Sub_metering_1}
          isOn={data?.Sub1_on}
        />
        <DeviceCard 
          deviceNum={2}
          consumption={data?.Sub_metering_2}
          isOn={data?.Sub2_on}
        />
        <DeviceCard 
          deviceNum={3}
          consumption={data?.Sub_metering_3}
          isOn={data?.Sub3_on}
        />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">📊 Legenda do Sistema</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
              <span className="text-gray-700">0 Wh - Consumo zero (eficiente)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded"></div>
              <span className="text-gray-700">≤ 100 Wh - Consumo baixo</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-yellow-50 border-2 border-yellow-200 rounded"></div>
              <span className="text-gray-700">≤ 500 Wh - Consumo moderado</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-orange-50 border-2 border-orange-200 rounded"></div>
              <span className="text-gray-700">&gt; 500 Wh - Consumo alto</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Dica</h4>
            <p className="text-sm text-blue-800">
              Clique em qualquer card de dispositivo para ver o histórico detalhado de consumo, 
              gráficos de uso por horário e recomendações de economia de energia.
            </p>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 bg-gray-800 text-white rounded-lg p-4 text-xs font-mono">
        <div className="font-bold mb-2">🔍 Debug Info:</div>
        <div>Campos disponíveis: {data ? Object.keys(data).join(', ') : 'Nenhum'}</div>
        <div className="mt-2">Sub_metering_1: {data?.Sub_metering_1 ?? 'undefined'}</div>
        <div>Sub_metering_2: {data?.Sub_metering_2 ?? 'undefined'}</div>
        <div>Sub_metering_3: {data?.Sub_metering_3 ?? 'undefined'}</div>
        <div className="mt-2">Sub1_on: {String(data?.Sub1_on ?? 'undefined')}</div>
        <div>Sub2_on: {String(data?.Sub2_on ?? 'undefined')}</div>
        <div>Sub3_on: {String(data?.Sub3_on ?? 'undefined')}</div>
      </div>
    </div>
  );
}