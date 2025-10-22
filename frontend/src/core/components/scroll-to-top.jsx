import { useEffect } from "react";
import { useLocation } from "react-router";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant", // Menggunakan "instant" untuk scroll langsung tanpa animasi
    });
  }, [pathname]);

  return null;
}
