"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PanelLayout({ children }) {
  const { user, perfil, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !user) {
      router.push("/login");
    }
  }, [user, cargando, router]);

  if (cargando) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0d0f12", color: "#fff" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem" }}></i>
      </div>
    );
  }

  return <>{children}</>;
}
