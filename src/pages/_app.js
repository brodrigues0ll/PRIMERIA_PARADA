import "../../public/assets/fonts/MilkyMatcha.css";
import "../../public/assets/fonts/Itim.css";
import "../styles/main.css";
import AuthRoute from "../components/AuthRoute";

export default function App({ Component, pageProps }) {
  return (
    <AuthRoute>
      <Component {...pageProps} />
    </AuthRoute>
  );
}
