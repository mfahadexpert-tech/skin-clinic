/**
 * ==============================================================================
 * SkinLab AI - Root Application Layout
 * ==============================================================================
 * Sets up global metadata, high-DPI typography, and theme styling.
 * ==============================================================================
 */

import './globals.css';

export const metadata = {
  title: 'SkinLab AI — Premium Aesthetic & Dermatology Clinic Operating System',
  description: 'Enterprise Clinic Management, Treatment POS, PRM, and LangGraph Clinical Intelligence Suite',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans selection:bg-teal-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
