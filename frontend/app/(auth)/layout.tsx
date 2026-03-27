export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black">
      {/* Galaxy background image (blurred + dimmed) */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 blur-[2px]"
        style={{ backgroundImage: "url('/galaxy-bg.png')" }}
      />

      {/* Dark overlay for readability */}
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      {/* Auth card */}
      <div className="relative z-10 mx-4 w-full max-w-[780px]">
        {children}
      </div>
    </div>
  );
}
