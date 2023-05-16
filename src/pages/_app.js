import "../../public/assets/fonts/MilkyMatcha.css";
import "../../public/assets/fonts/Itim.css";
import "../styles/main.css";
import AuthRoute from "../components/AuthRoute";
import Head from "next/head";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("Service Worker registrado com sucesso:", registration);
          })
          .catch((error) => {
            console.log("Falha ao registrar o Service Worker:", error);
          });
      });
    }
  }, []);

  return (
    <AuthRoute>
      <Head>
        <title>Primeira Parada</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </AuthRoute>
  );
}
