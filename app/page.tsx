import { LandingPage } from "@/components/marketing/landing-page";
import { JsonLd } from "@/components/marketing/json-ld";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  alternates: { canonical: "/" },
});

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <LandingPage />
    </>
  );
}
