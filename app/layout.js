import "./globals.css";

export const metadata = {
  title: "BFlow",
  description: "Task tracker personal — Andrei Bran",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
    <body className="min-h-screen bg-[#0f1117] text-gray-200 antialiased">
  {children}
    </body>
    </html>
  );
}
