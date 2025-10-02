// components/Charts.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Charts = ({ data }) => {
  // Processar dados para o formato do Recharts
  const processChartData = () => {
    const groupedData = {};
    
    data.forEach(item => {
      const time = new Date(item._time).toLocaleTimeString();
      if (!groupedData[time]) {
        groupedData[time] = { time };
      }
      groupedData[time][item._field] = item._value;
    });
    
    return Object.values(groupedData);
  };

  const chartData = processChartData();

  return (
    <div className="charts">
      <h2>Gráficos de Energia</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="power" stroke="#8884d8" />
          <Line type="monotone" dataKey="voltage" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;