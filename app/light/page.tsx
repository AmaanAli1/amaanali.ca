import type { Metadata } from "next";
import HomeLight from "@/components/HomeLight";

export const metadata: Metadata = { title: "Light", alternates: { canonical: "/" } };

export default function Page() {
  return <HomeLight />;
}
