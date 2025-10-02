import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const API_BASE_URL = 'http://localhost:3001/api';

export default function Homepage() {
  const [energyData, setEnergyData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedMeasurement, setSelectedMeasurement] = useState('Ecalc_Wh');
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

        // Use a rota que busca fields específicos
        const response = await fetch(
          `${API_BASE_URL}/measurement/specific-fields/${selectedMeasurement}?fields=Pdc,Pac,Cbattery1,sub_metering_1,sub_metering_2,sub_metering_3,voltage,global_intensity&days=${selectedDays}`
        );
        
        const result = await response.json();

        if (result.success) {
          console.log('Dados recebidos:', result.data.slice(0, 3)); // Debug
          
          const formattedData = result.data.map(item => ({
            time: new Date(item._time).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            timestamp: new Date(item._time).getTime(),
            // Mapeie para os campos reais do seu InfluxDB
            Pdc: item.Pdc || 0,
            Pac: item.Pac || 0,
            Cbattery1: item.Cbattery1 || 0,
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
        console.error('Erro detalhado:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnergyData();
  }, [selectedDays, selectedMeasurement]);

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

  // Calcular estatísticas baseadas nos campos reais
  const calculateStats = (data) => {
    if (data.length === 0) return;

    // Use Pdc ou Pac dependendo do que representa potência ativa
    const totalConsumption = data.reduce((sum, d) => sum + (d.Pdc || 0), 0);
    const avgPower = data.length > 0 ? totalConsumption / data.length : 0;
    const peakPower = Math.max(...data.map(d => d.Pdc || 0));
    const activeDevices = devices.length;

    setStats({
      totalConsumption: totalConsumption.toFixed(2),
      avgPower: avgPower.toFixed(2),
      peakPower: peakPower.toFixed(2),
      activeDevices
    });
  };

  // Componente de Card de Estatística
  const StatCard = ({ title, value, unit, icon, color = "gray" }) => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value} <span className="text-lg font-normal text-gray-600">{unit}</span>
          </p>
        </div>
        <div className={`text-3xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do InfluxDB...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ Erro ao carregar dados: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Energia - Goodwe</h1>
          <p className="text-gray-600 mt-1">Monitoramento do sistema solar/inversor</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <select
            value={selectedMeasurement}
            onChange={(e) => setSelectedMeasurement(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Ecalc_Wh">Energia (Ecalc_Wh)</option>
            <option value="out_Wh">Saída (out_Wh)</option>
            {/* Adicione outras measurements conforme necessário */}
          </select>
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          title="Potência DC (Pdc)"
          value={stats.totalConsumption}
          unit="W"
          icon="⚡"
          color="text-yellow-500"
        />
        <StatCard
          title="Potência Média"
          value={stats.avgPower}
          unit="W"
          icon="📊"
          color="text-blue-500"
        />
        <StatCard
          title="Pico de Potência"
          value={stats.peakPower}
          unit="W"
          icon="🔝"
          color="text-red-500"
        />
        <StatCard
          title="Bateria (Cbattery1)"
          value={energyData.length > 0 ? (energyData[energyData.length - 1]?.Cbattery1 || 0).toFixed(2) : '0'}
          unit="%"
          icon="🔋"
          color="text-green-500"
        />
      </div>

      {/* Gráfico Principal - Potência DC e AC */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Potência DC e AC</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={energyData}>
            <defs>
              <linearGradient id="colorPdc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPac" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
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
              label={{ value: 'Watts (W)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="Pdc" 
              stroke="#8884d8" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPdc)"
              name="Potência DC"
            />
            <Area 
              type="monotone" 
              dataKey="Pac" 
              stroke="#82ca9d" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPac)"
              name="Potência AC"
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
              name="Sub-metering 1"
            />
            <Line 
              type="monotone" 
              dataKey="subMetering2" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name="Sub-metering 2"
            />
            <Line 
              type="monotone" 
              dataKey="subMetering3" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              name="Sub-metering 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Dados (opcional para debug) */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Dados Recentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Data/Hora</th>
                <th className="text-left p-2">Pdc (W)</th>
                <th className="text-left p-2">Pac (W)</th>
                <th className="text-left p-2">Bateria (%)</th>
              </tr>
            </thead>
            <tbody>
              {energyData.slice(-5).map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{item.time}</td>
                  <td className="p-2">{item.Pdc?.toFixed(2) || '0'}</td>
                  <td className="p-2">{item.Pac?.toFixed(2) || '0'}</td>
                  <td className="p-2">{item.Cbattery1?.toFixed(2) || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}