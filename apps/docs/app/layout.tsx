import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "qrx documentation",
  description: "Production-grade QR generation docs, samples, and advanced studio"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="site-header-inner">
              <Link className="brand" href="/">
                qrx • docs
              </Link>
              <nav className="nav-links">
                <Link className="nav-pill" href="/">
                  Overview
                </Link>
                <Link className="nav-pill" href="/playground">
                  QR Studio
                </Link>
                <Link className="nav-pill" href="/samples">
                  Samples
                </Link>
                <Link className="nav-pill" href="/reference">
                  Reference
                </Link>
              </nav>
            </div>
          </header>
          {children}
          <footer className="site-footer">
            <div className="site-footer-inner">
              <span>qrx open-source toolkit</span>
              <span>Built for developers and product teams</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
