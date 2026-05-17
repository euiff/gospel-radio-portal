import { createStart, createMiddleware } from "@tanstack/react-start";
import { StartClient } from "@tanstack/react-start/client";
import { createRoot, hydrateRoot } from "react-dom/client";
import { getRouter } from "./router";

 import { consumeLastCapturedError } from "./lib/error-capture";
 import { renderErrorPage } from "./lib/error-page";
 
 const errorMiddleware = createMiddleware().server(async ({ next }) => {
   try {
     return await next();
   } catch (error) {
     console.error("Server Error:", consumeLastCapturedError() || error);
     return new Response(renderErrorPage(), {
       status: 500,
       headers: { "content-type": "text/html; charset=utf-8" },
     });
   }
 });

export const startInstance = createStart(() => ({
  router: getRouter(),
  requestMiddleware: [errorMiddleware],
}));

if (typeof document !== "undefined") {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    if (rootElement.innerHTML) {
      hydrateRoot(rootElement, <StartClient />);
    } else {
      createRoot(rootElement).render(<StartClient />);
    }
  }
}
