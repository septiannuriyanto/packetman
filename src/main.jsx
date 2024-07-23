import React from 'react'
import ReactDOM from 'react-dom/client'
import HomePage from './HomePage.jsx'
import FormInputSuratJalan from './FormInputSuratJalan.jsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'


const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement : <div><h1>Check your URL</h1></div>,
  },
  {
    path: '/input',
    element: <FormInputSuratJalan />,
    
  },

]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
