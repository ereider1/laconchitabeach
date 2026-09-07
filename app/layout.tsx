import type { Metadata } from "next";
import { headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const title = "La Conchita Beach | California Coastal Community";
const description =
  "Community news, events, resources, and resident services for La Conchita Beach, California.";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og.png", width: 1732, height: 908, alt: "La Conchita Beach, California coastal community" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const isLocalHost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const configuredPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const publishableKey = isLocalHost && configuredPublishableKey?.startsWith("pk_live_")
    ? undefined
    : configuredPublishableKey;

  return (
    <html lang="en">
      <body className="font-body">
        <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
