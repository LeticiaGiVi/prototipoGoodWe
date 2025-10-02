import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dispositivos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar os dados da API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/measurement/fields/Ecalc_Wh?days=30');
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        // Pegar o último registro (mais recente)
        const lastRecord = result.data[result.data.length - 1];
        setData(lastRecord);
      } else {
        throw new Error('Nenhum dado encontrado');
      }
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados ao carregar o componente
  useEffect(() => {
    fetchData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(fetchData, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // Função para determinar a cor do card baseado no consumo
  const getCardColor = (consumption, isOn) => {
    if (!isOn) return 'bg-gray-100 border-gray-300';
    if (consumption === 0) return 'bg-green-50 border-green-200';
    if (consumption <= 100) return 'bg-blue-50 border-blue-200';
    if (consumption <= 500) return 'bg-yellow-50 border-yellow-200';
    return 'bg-orange-50 border-orange-200';
  };

  // Função para determinar a cor do texto do status
  const getStatusColor = (isOn) => {
    return isOn ? 'text-green-600' : 'text-gray-500';
  };

  // Função para determinar a cor do badge de energia solar
  const getSolarBadgeColor = (isOn) => {
    return isOn ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4" data-testid="text-dispositivos-title">
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
      <div className="p-6 bg-white min-h-screen">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4" data-testid="text-dispositivos-title">
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

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900" data-testid="text-dispositivos-title">
          Monitoramento de Dispositivos
        </h1>
        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Atualizar Dados
        </button>
      </div>

      {/* Informações da última atualização */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-4 text-sm text-gray-700">
          <span className="font-medium">Última atualização:</span>
          <span className="font-mono text-gray-900 bg-white px-2 py-1 rounded border">
            {data?._time ? new Date(data._time).toLocaleString('pt-BR') : 'N/A'}
          </span>
          <span className="text-green-600">●</span>
          <span>Atualização automática a cada 30 segundos</span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Dispositivo 1 */}
        <div 
          className={`border-2 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md ${getCardColor(
            data?.sub_metering_1 || 0, 
            data?.Sub1_on
          )}`}
          data-testid="card-dispositivo-1"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Dispositivo 1
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSolarBadgeColor(data?.Sub1_on)}`}>
              {data?.Sub1_on ? '🌞 Solar' : '⚡ Rede'}
            </span>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {data?.sub_metering_1 !== undefined ? data.sub_metering_1.toFixed(2) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Watts-hora (Wh)</div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${getStatusColor(data?.Sub1_on)}`}>
              {data?.Sub1_on ? '🔌 Conectado' : '🔴 Desligado'}
            </span>
          </div>
        </div>

        {/* Dispositivo 2 */}
        <div 
          className={`border-2 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md ${getCardColor(
            data?.sub_metering_2 || 0, 
            data?.Sub2_on
          )}`}
          data-testid="card-dispositivo-2"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Dispositivo 2
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSolarBadgeColor(data?.Sub2_on)}`}>
              {data?.Sub2_on ? '🌞 Solar' : '⚡ Rede'}
            </span>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {data?.sub_metering_2 !== undefined ? data.sub_metering_2.toFixed(2) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Watts-hora (Wh)</div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${getStatusColor(data?.Sub2_on)}`}>
              {data?.Sub2_on ? '🔌 Conectado' : '🔴 Desligado'}
            </span>
          </div>
        </div>

        {/* Dispositivo 3 */}
        <div 
          className={`border-2 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md ${getCardColor(
            data?.sub_metering_3 || 0, 
            data?.Sub3_on
          )}`}
          data-testid="card-dispositivo-3"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Dispositivo 3
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSolarBadgeColor(data?.Sub3_on)}`}>
              {data?.Sub3_on ? '🌞 Solar' : '⚡ Rede'}
            </span>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {data?.sub_metering_3 !== undefined ? data.sub_metering_3.toFixed(2) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Watts-hora (Wh)</div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${getStatusColor(data?.Sub3_on)}`}>
              {data?.Sub3_on ? '🔌 Conectado' : '🔴 Desligado'}
            </span>
          </div>
        </div>
      </div>

      {/* Resumo do Sistema */}
      <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-600 mb-1 text-sm font-medium">Dispositivos Ativos</div>
            <div className="text-2xl font-bold text-gray-900">
              {[data?.Sub1_on, data?.Sub2_on, data?.Sub3_on].filter(Boolean).length} / 3
            </div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-600 mb-1 text-sm font-medium">Usando Energia Solar</div>
            <div className="text-2xl font-bold text-green-600">
              {[data?.Sub1_on, data?.Sub2_on, data?.Sub3_on].filter(Boolean).length} / 3
            </div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-600 mb-1 text-sm font-medium">Consumo Total</div>
            <div className="text-2xl font-bold text-blue-600">
              {(
                (data?.sub_metering_1 || 0) + 
                (data?.sub_metering_2 || 0) + 
                (data?.sub_metering_3 || 0)
              ).toFixed(2)} Wh
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Legenda do Sistema:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
            <span className="text-gray-700">🌞 Solar = Energia solar</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
            <span className="text-gray-700">⚡ Rede = Energia elétrica</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded"></div>
            <span className="text-gray-700">🔌 Conectado = Ativo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
            <span className="text-gray-700">🔴 Desligado = Inativo</span>
          </div>
        </div>
      </div>

      {/* Informações de Cores */}
      <div className="mt-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Significado das Cores:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-yellow-700">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
            <span>0Wh (Eficiente)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
            <span>≤100Wh (Baixo)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span>≤500Wh (Moderado)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
            <span>&gt;500Wh (Alto)</span>
          </div>
        </div>
      </div>
    </div>
  );
}