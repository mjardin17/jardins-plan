import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import WidgetView from './components/WidgetView.tsx';
import './index.css';

const path = window.location.pathname;
const isWidget = path.startsWith('/widget/');
const businessId = isWidget ? path.split('/widget/')[1] : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isWidget && businessId ? <WidgetView businessId={businessId} /> : <App />}
  </StrictMode>,
);

