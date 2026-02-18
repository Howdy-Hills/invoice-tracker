export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
