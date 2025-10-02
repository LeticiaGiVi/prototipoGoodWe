import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// Importações das páginas
import PageNotFound from './pages/PageNotFound.jsx'
import Homepage from './pages/Home.jsx'
import Dispositivos from './pages/dispositivos.jsx'
import DetalhesDispositivos from './pages/DetalhesDispositivos.jsx'
import Configuracoes from './pages/Configuracoes.jsx'

// Configuração do router
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { 
        index: true, 
        element: <Homepage /> 
      },
      { 
        path: "dispositivos", 
        element: <Dispositivos /> 
      },
      { 
        path: "dispositivos/:id", 
        element: <DetalhesDispositivos /> 
      },
      { 
        path: "configuracoes", 
        element: <Configuracoes /> 
      },
      { 
        path: "*", 
        element: <PageNotFound /> 
      }
    ]
  }
])

// Debug: Verificar se o router foi criado corretamente
console.log('🚀 Router configurado com as seguintes rotas:');
console.log('  - / (Homepage)');
console.log('  - /dispositivos (Lista de Dispositivos)');
console.log('  - /dispositivos/:id (Detalhes do Dispositivo)');
console.log('  - /configuracoes (Configurações)');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)