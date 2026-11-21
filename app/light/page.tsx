import type { Metadata } from "next";
import HomeLight from "@/components/HomeLight";

export const metadata: Metadata = { title: { absolute: "Amaan Ali · CS Portfolio" }, alternates: { canonical: "/" } };

export default function Page() {
  return <HomeLight />;
}
