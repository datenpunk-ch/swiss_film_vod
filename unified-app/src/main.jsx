import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const rootEl = document.getElementById("unified-root");
if (!rootEl) {
  document.body.innerHTML = "<p style='padding:1rem'>Fehler: #unified-root fehlt.</p>";
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (e) {
    rootEl.innerHTML = `<p class="panel-intro panel-error">React-Fehler: ${e.message}</p>`;
    console.error(e);
  }
}
