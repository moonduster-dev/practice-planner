// Coach view has its own layout without the navbar
// This is a read-only shareable view

export default function CoachViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
