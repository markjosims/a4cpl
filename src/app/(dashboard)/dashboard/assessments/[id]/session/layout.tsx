export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="fixed inset-0 top-16 bg-gray-50">{children}</div>;
}
