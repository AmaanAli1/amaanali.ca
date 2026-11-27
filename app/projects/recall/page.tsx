import type { Metadata } from "next";
import { RecallPage } from "../case-study";

export const metadata: Metadata = {
  title: "Recall case study",
  description:
    "An AI study assistant that answers from a real textbook with page-level citations, measured by its own evaluation harness and shipped through 665 tests, Docker and AWS Lambda.",
};

export default function Page() {
  return <RecallPage />;
}
