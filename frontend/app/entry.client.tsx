import "@assets/styles/global.css"
import * as React from "react"
import * as ReactDOM from "react-dom/client"
import router from "./routes"
import { RouterProvider } from "react-router-dom"
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId = '544730488651-rsgigbm1dfciek9q0d9pkt4mbr11s1tr.apps.googleusercontent.com'>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);

