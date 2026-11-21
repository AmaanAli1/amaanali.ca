import type { Metadata } from "next";
import HomeApp from "../home-app";

export const metadata: Metadata = { title: { absolute: "Amaan Ali · CS Portfolio" }, alternates: { canonical: "/" } };

export default function Page() {
  return <HomeApp initial="light" />;
}
