import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const API_BASE_URL = 'http://localhost:3001/api';

export default function Homepage() {
  const [energyData, setEnergyData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [stats, setStats] = useState({
    totalConsumption: 0,
    avgPower: 0,
    peakPower: 0,
    activeDevices: 0
  });

  // Buscar dados de energia
  useEffect(() => {
    const fetchEnergyData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/measurement/fields/Ecalc_Wh?days=${selectedDays}`
        );
        const result = await response.json();

        if (result.success) {
          const formattedData = result.data.map(item => ({
            time: new Date(item._time).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            timestamp: new Date(item._time).getTime(),
            globalActivePower: item.global_active_power || 0,
            subMetering1: item.sub_metering_1 || 0,
            subMetering2: item.sub_metering_2 || 0,
            subMetering3: item.sub_metering_3 || 0,
            voltage: item.voltage || 0,
            current: item.global_intensity || 0
          }));

          setEnergyData(formattedData);
          calculateStats(formattedData);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnergyData();
  }, [selectedDays]);

  // Buscar dispositivos
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/devices/sub-metering?days=1`);
        const result = await response.json();

        if (result.success) {
          setDevices(result.devices);
        }
      } catch (err) {
        console.error('Erro ao buscar dispositivos:', err);
      }
    };

    fetchDevices();
  }, []);

  // Calcular estatísticas
  const calculateStats = (data) => {
    if (data.length === 0) return;

    const totalConsumption = data.reduce((sum, d) => sum + d.globalActivePower, 0);
    const avgPower = totalConsumption / data.length;
    const peakPower = Math.max(...data.map(d => d.globalActivePower));
    const activeDevices = devices.filter(d => d.status === 'active').length;

    setStats({
      totalConsumption: totalConsumption.toFixed(2),
      avgPower: avgPower.toFixed(2),
      peakPower: peakPower.toFixed(2),
      activeDevices
    });
  };

  // Componente de Card de Estatística
  const StatCard = ({ title, value, unit, icon }) => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value} <span className="text-lg font-normal text-gray-600">{unit}</span>
          </p>
        </div>
        <div className="text-primary text-3xl">{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Energia</h1>
          <p className="text-gray-600 mt-1">Monitoramento em tempo real do consumo</p>
        </div>
        <div>
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={1}>Últimas 24h</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={15}>Últimos 15 dias</option>
            <option value={30}>Últimos 30 dias</option>
          </select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Consumo Total"
          value={stats.totalConsumption}
          unit="kW"
          icon="⚡"
        />
        <StatCard
          title="Potência Média"
          value={stats.avgPower}
          unit="kW"
          icon="📊"
        />
        <StatCard
          title="Pico de Potência"
          value={stats.peakPower}
          unit="kW"
          icon="🔝"
        />
        <StatCard
          title="Dispositivos Ativos"
          value={devices.length}
          unit=""
          icon="🔌"
        />
      </div>

      {/* Gráfico Principal - Consumo Global */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Consumo de Energia Global</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={energyData}>
            <defs>
              <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8AC4CC" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8AC4CC" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#888"
              label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="globalActivePower" 
              stroke="#8AC4CC" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPower)"
              name="Potência Global"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Sub-Metering */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Consumo por Dispositivo</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#888"
              label={{ value: 'Wh', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="subMetering1" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              name="Dispositivo 1"
            />
            <Line 
              type="monotone" 
              dataKey="subMetering2" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name="Dispositivo 2"
            />
            <Line 
              type="monotone" 
              dataKey="subMetering3" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              name="Dispositivo 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Tensão e Corrente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Tensão</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                stroke="#888"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#888"
                label={{ value: 'V', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="voltage" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                name="Tensão (V)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Corrente</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                stroke="#888"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#888"
                label={{ value: 'A', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
                name="Corrente (A)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}