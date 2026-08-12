import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import App from './app/App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to locate target DOM root element container.');

createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
