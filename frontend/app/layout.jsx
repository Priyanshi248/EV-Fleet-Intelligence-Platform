import './globals.css';
import AppLayout from '@/components/AppLayout';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'EV Fleet Intelligence Platform',
  description: 'AI-Powered EV Fleet Intelligence, Battery Health, Predictive Maintenance & Decarbonization Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-slate-800 bg-[#f8fafc]">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
