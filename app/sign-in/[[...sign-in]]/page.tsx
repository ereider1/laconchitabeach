import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(rgba(7,74,96,.58),rgba(7,158,196,.28)),url('/beach-hero-bg.jpg')] bg-cover bg-center px-6 py-16">
      <div>
        <p className="mb-6 text-center text-2xl font-bold uppercase tracking-[-0.04em] text-white">La Conchita Beach</p>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#079EC4",
              colorBackground: "#FFFFFF",
              fontFamily: "var(--font-body)",
              borderRadius: "1rem",
            },
          }}
        />
      </div>
    </main>
  );
}
