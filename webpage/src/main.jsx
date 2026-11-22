import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { chosen, use } from "../../src/i18n/browser.ts";
import App from "./App.jsx";
import "./style.css";

// the pack of the chosen language first, so the English does not flash (src/i18n)
await use(chosen());
createRoot(document.getElementById("root")).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
