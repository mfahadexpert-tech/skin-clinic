import './globals.css';

export const metadata = {
  title: 'Hospital Management & AI Agent System — SkinLab Clinical OS',
  description: 'Enterprise Clinic Management, Token-Based Queue, Receptionist Approval Workflow, Prescription Versioning & Governed Clinical AI Assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans bg-[#E0FBFC] text-[#253237]">
        {children}
      </body>
    </html>
  );
}
