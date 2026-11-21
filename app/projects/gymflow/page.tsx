import type { Metadata } from "next";
import GymFlowCaseStudy from "@/components/GymFlowCaseStudy";

export const metadata: Metadata = {
  title: "GymFlow case study",
  description: "A full-stack gym management system built solo: 68 REST endpoints, 16 MySQL tables, rate limiting, validation and a self-resetting demo.",
};

export default function Page() {
  return <GymFlowCaseStudy />;
}
