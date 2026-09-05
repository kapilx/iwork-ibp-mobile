// import { StrictMode } from "react";
import * as ReactDOM from "react-dom/client";
import process from 'process';
import App from './app/app';

window.process = process;

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Uncomment StrictMode below to enable React's strict mode
root.render(
  // <StrictMode>
    <App />
  // </StrictMode>
);
