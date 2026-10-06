import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Search' },
  { href: '/preferences', label: 'Preferences' },
  { href: '/saved', label: 'Saved' },
  { href: '/applications', label: 'Applications' },
  { href: '/settings', label: 'Settings' },
];

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight font-display">
          AlgoScore
        </Link>
        <nav className="flex items-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
