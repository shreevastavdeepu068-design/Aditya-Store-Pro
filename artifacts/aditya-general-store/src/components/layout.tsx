import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Home, Grid, ShoppingCart, User, MoreVertical, Settings } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/categories", label: "Categories", icon: Grid },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-secondary text-secondary-foreground pb-safe z-50 rounded-t-xl shadow-2xl">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={`flex flex-col items-center justify-center h-full w-full space-y-1 ${
                  isActive ? "text-primary" : "text-secondary-foreground/70"
                }`}
              >
                <Icon size={20} className={isActive ? "fill-primary/20 stroke-primary" : ""} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function KebabMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="absolute top-3 right-3" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
          <Link href="/admin">
            <div
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
            >
              <Settings size={14} /> Store Management
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-white border-t border-border mt-12 py-8 px-4 text-center pb-24">
      <KebabMenu />
      <div className="max-w-md mx-auto">
        <p className="text-sm font-semibold text-foreground">Aditya General Store</p>
        <p className="text-xs text-muted-foreground mt-1">Tajpur Road, Sidhpura, Kasganj</p>
        <p className="text-xs text-muted-foreground mt-4">© 2026 Aditya General Store. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export function PageLayout({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative w-full overflow-x-hidden">
      <main className="flex-1 w-full max-w-md mx-auto bg-background relative shadow-sm border-x border-border/50 min-h-[100dvh]">
        {children}
        <Footer />
        {!hideNav && <BottomNav />}
      </main>
    </div>
  );
}
