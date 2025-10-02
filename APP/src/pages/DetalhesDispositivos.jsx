import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function DetalhesDispositivos() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    peak: 0,
    peakTime: '',
    solarUsage: 0
  });

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:3001/api/measurement/fields/Ecalc_Wh?days=${selectedDays}`);
        
        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          const fieldName = `sub_metering_${id}`;
          const statusField = `Sub${id}_on`;
          
          const processedData = result.data.map(item => ({
            time: new Date(item._time).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            hour: new Date(item._time).getHours(),
            consumption: item[fieldName] || 0,
            usingSolar: item[statusField] || false,
            timestamp: new Date(item._time).getTime()
          }));
          
          setData(processedData);
          calculateStats(processedData);
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

    fetchDeviceData();
  }, [id, selectedDays]);

  const calculateStats = (deviceData) => {
    if (deviceData.length === 0) return;

    const total = deviceData.reduce((sum, d) => sum + d.consumption, 0);
    const average = total / deviceData.length;
    const peakData = deviceData.reduce((max, d) => d.consumption > max.consumption ? d : max, deviceData[0]);
    const solarUsage = (deviceData.filter(d => d.usingSolar).length / deviceData.length) * 100;

    setStats({
      total: total.toFixed(2),
      average: average.toFixed(2),
      peak: peakData.consumption.toFixed(2),
      peakTime: peakData.time,
      solarUsage: solarUsage.toFixed(1)
    });
  };

  const getHourlyData = () => {
    const hourlyConsumption = {};
    
    data.forEach(item => {
      const hour = item.hour;
      if (!hourlyConsumption[hour]) {
        hourlyConsumption[hour] = { total: 0, count: 0 };
      }
      hourlyConsumption[hour].total += item.consumption;
      hourlyConsumption[hour].count += 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}h`,
      hourNum: i,
      consumption: hourlyConsumption[i] 
        ? parseFloat((hourlyConsumption[i].total / hourlyConsumption[i].count).toFixed(2))
        : 0
    }));
  };

  const getTopConsumptionHours = () => {
    const hourlyData = getHourlyData();
    return hourlyData
      .filter(h => h.consumption > 0)
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 5);
  };

  const getPeakPeriods = () => {
    const hourlyData = getHourlyData();
    const maxConsumption = Math.max(...hourlyData.map(h => h.consumption));
    
    if (maxConsumption === 0) return [];

    const threshold = maxConsumption * 0.7; // 70% do consumo máximo
    const peakHours = hourlyData.filter(h => h.consumption >= threshold);
    
    // Agrupar horas consecutivas
    const periods = [];
    let currentPeriod = null;
    
    peakHours.forEach(hour => {
      if (!currentPeriod) {
        currentPeriod = {
          start: hour.hourNum,
          end: hour.hourNum,
          avgConsumption: hour.consumption
        };
      } else if (hour.hourNum === currentPeriod.end + 1) {
        currentPeriod.end = hour.hourNum;
        currentPeriod.avgConsumption = (currentPeriod.avgConsumption + hour.consumption) / 2;
      } else {
        periods.push(currentPeriod);
        currentPeriod = {
          start: hour.hourNum,
          end: hour.hourNum,
          avgConsumption: hour.consumption
        };
      }
    });
    
    if (currentPeriod) {
      periods.push(currentPeriod);
    }
    
    return periods;
  };

  const StatCard = ({ title, value, unit, icon, color = "gray", subtitle }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-600 text-sm font-medium">{title}</div>
        <div className={`text-2xl ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {value} <span className="text-lg font-normal text-gray-600">{unit}</span>
      </div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados do dispositivo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto mt-20">
          <div className="text-red-600 text-4xl mb-2 text-center">⚠️</div>
          <h3 className="text-red-800 font-semibold mb-2 text-center">Erro ao carregar dados</h3>
          <p className="text-red-600 mb-4 text-center">{error}</p>
          <Link
            to="/dispositivos"
            className="block text-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Voltar para Dispositivos
          </Link>
        </div>
      </div>
    );
  }

  const hourlyData = getHourlyData();
  const topHours = getTopConsumptionHours();
  const peakPeriods = getPeakPeriods();
  const currentStatus = data.length > 0 ? data[data.length - 1] : null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Link 
          to="/dispositivos"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
        >
          ← Voltar para Dispositivos
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dispositivo {id} - Análise Detalhada
            </h1>
            <p className="text-gray-600">
              Monitoramento completo de consumo e padrões de uso
            </p>
          </div>
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
        </div>
      </div>

      {/* Status Atual */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Status Atual:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentStatus?.usingSolar 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}>
              {currentStatus?.usingSolar ? '🌞 Usando Energia Solar' : '⚡ Usando Rede Elétrica'}
            </span>
            <span className="text-sm text-gray-600">
              Consumo: <strong>{currentStatus?.consumption.toFixed(2)} Wh</strong>
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Atualizado em: {currentStatus?.time}
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Consumo Total"
          value={stats.total}
          unit="Wh"
          icon="⚡"
          color="text-yellow-500"
          subtitle={`Período de ${selectedDays} dia(s)`}
        />
        <StatCard
          title="Média de Consumo"
          value={stats.average}
          unit="Wh"
          icon="📊"
          color="text-blue-500"
          subtitle="Por registro"
        />
        <StatCard
          title="Pico de Consumo"
          value={stats.peak}
          unit="Wh"
          icon="🔝"
          color="text-red-500"
          subtitle={stats.peakTime}
        />
        <StatCard
          title="Uso Solar"
          value={stats.solarUsage}
          unit="%"
          icon="🌞"
          color="text-green-500"
          subtitle="Do tempo total"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            📈 Histórico de Consumo
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="consumption" 
                stroke="#3b82f6" 
                fillOpacity={1}
                fill="url(#colorConsumption)"
                name="Consumo (Wh)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            🕐 Consumo Médio por Horário
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${value} Wh`, 'Consumo']}
              />
              <Bar 
                dataKey="consumption" 
                fill="#10b981" 
                radius={[8, 8, 0, 0]}
                name="Consumo Médio"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Períodos de Pico */}
      {peakPeriods.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-sm p-6 border-2 border-red-200 mb-6">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🔥</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Períodos de Pico de Consumo
              </h2>
              <p className="text-sm text-gray-600">
                Horários com consumo acima de 70% do máximo registrado
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {peakPeriods.map((period, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg p-4 border-2 border-orange-200 shadow-sm"
              >
                <div className="text-center mb-3">
                  <div className="text-3xl mb-2">⏰</div>
                  <div className="text-lg font-bold text-gray-900">
                    {period.start.toString().padStart(2, '0')}:00 - {(period.end + 1).toString().padStart(2, '0')}:00
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Consumo Médio</div>
                  <div className="text-xl font-semibold text-orange-600">
                    {period.avgConsumption.toFixed(2)} Wh
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                  <span className="text-xs text-red-600 font-medium">
                    ⚠️ Período de Alto Consumo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 5 Horários */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          🏆 Top 5 Horários de Maior Consumo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topHours.map((hour, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-2 text-center transition-transform hover:scale-105 ${
                index === 0 
                  ? 'bg-red-50 border-red-300' 
                  : index === 1
                  ? 'bg-orange-50 border-orange-300'
                  : index === 2
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="text-3xl mb-2">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{hour.hour}</div>
              <div className="text-lg font-semibold text-gray-700 mb-1">
                {hour.consumption} Wh
              </div>
              <div className="text-xs text-gray-500">
                Posição #{index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recomendações */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border-2 border-blue-200">
        <div className="flex items-start space-x-4">
          <span className="text-4xl">💡</span>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-blue-900 mb-3">
              Recomendações para Economia de Energia
            </h3>
            <div className="space-y-3">
              {topHours.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start">
                    <span className="text-red-500 mr-2 mt-1">🔴</span>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Horários de Pico Identificados</div>
                      <div className="text-sm text-gray-700">
                        O maior consumo ocorre entre <strong>{topHours[0]?.hour}</strong> e <strong>{topHours[1]?.hour}</strong>. 
                        Evite usar o dispositivo nesses horários para reduzir custos.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">🌞</span>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Aproveitamento Solar</div>
                    <div className="text-sm text-gray-700">
                      Você está usando energia solar em <strong>{stats.solarUsage}%</strong> do tempo. 
                      {parseFloat(stats.solarUsage) < 50 
                        ? ' Tente usar mais o dispositivo durante o dia para aproveitar a energia solar.'
                        : ' Excelente aproveitamento da energia solar!'}
                    </div>
                  </div>
                </div>
              </div>

              {peakPeriods.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">⚠️</span>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Períodos Críticos</div>
                      <div className="text-sm text-gray-700">
                        Foram identificados <strong>{peakPeriods.length}</strong> período(s) de alto consumo. 
                        Redistribua o uso do dispositivo para horários de menor demanda.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">📊</span>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Economia Potencial</div>
                    <div className="text-sm text-gray-700">
                      Reduzindo o uso nos horários de pico, você pode economizar até <strong>30%</strong> na sua conta de energia elétrica.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}