import "../../public/assets/fonts/MilkyMatcha.css";
import "../../public/assets/fonts/Itim.css";
import "../styles/main.css";
import AuthRoute from "../components/AuthRoute";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <AuthRoute>
      <Head>
        <title>Primeira Parada</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Component {...pageProps} />
    </AuthRoute>
  );
}
