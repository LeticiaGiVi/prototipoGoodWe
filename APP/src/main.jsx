import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import PageNotFound from './pages/PageNotFound.jsx'
import Homepage from './pages/Home.jsx'
import Dispositivos from './pages/dispositivos.jsx'
import Detalhesispositivos from './pages/DetalhesDispositivos.jsx'
import Configuracoes from './pages/Configuracoes.jsx'

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App/>,
      children:[
        {index: true, element: <Homepage/>},
        {path: "disp", element: <Dispositivos/>},
        {path: "disp/:id", element: <Detalhesispositivos/>},
        { path: "canfig", element: <Configuracoes/>},
        { path: "*", element: <PageNotFound/>}
      ]
    }
  ]
)


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
