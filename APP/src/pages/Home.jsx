export default function Homepage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4" data-testid="text-homepage-title">
        Homepage
      </h1>
      <div className="text-muted-foreground" data-testid="text-homepage-content">
        Esta página está em branco conforme solicitado.
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

export const useInfluxData = (endpoint, params = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(params)]);

  return { data, loading, error };
};