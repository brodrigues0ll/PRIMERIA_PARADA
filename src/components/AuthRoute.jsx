import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuth } from "firebase/auth";
import { database } from "@/services/firebase";
import Loading from "@/components/Loading";

function AuthRoute({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoading(false);
      if (!user) {
        router.push("/");
      } else {
        router.pathname === "/" && router.push("/home");
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return children;
}

export default AuthRoute;
