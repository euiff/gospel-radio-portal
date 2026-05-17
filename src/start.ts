import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

 const errorMiddleware = createMiddleware().server(async ({ next }) => {
   return await next();
 });

 export const startInstance = createStart(() => ({
   requestMiddleware: [errorMiddleware],
   defaultProps: {
     ssr: true,
   },
 }));
