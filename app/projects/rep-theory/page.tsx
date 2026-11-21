import type { Metadata } from "next";
import RepTheoryCaseStudy from "@/components/RepTheoryCaseStudy";

export const metadata: Metadata = {
  title: "Rep Theory case study",
  description: "A concept e-commerce store for lifting gear and training programs, built end to end with Next.js and Stripe as team lead.",
};

export default function Page() {
  return <RepTheoryCaseStudy />;
}
