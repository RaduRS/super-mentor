"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

type NavItem = {
  label: string;
  href: string;
  activeWhen?: (pathname: string) => boolean;
};

const NavItems: NavItem[] = [
  { label: "Home", href: "/", activeWhen: (p) => p === "/" },
  {
    label: "Dashboard",
    href: "/dashboard",
    activeWhen: (p) => p.startsWith("/dashboard"),
  },
  {
    label: "Schedule",
    href: "/dashboard#schedule",
    activeWhen: (p) => p.startsWith("/dashboard"),
  },
  { label: "Chat", href: "/chat", activeWhen: (p) => p.startsWith("/chat") },
  {
    label: "Profile",
    href: "/profile",
    activeWhen: (p) => p.startsWith("/profile"),
  },
  {
    label: "Edit onboarding",
    href: "/onboarding?edit=1",
    activeWhen: (p) => p.startsWith("/onboarding"),
  },
];

export function AppShell(props: { children: React.ReactNode }) {
  const { children } = props;
  const pathname = usePathname();

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {NavItems.map((item) => {
          const active = item.activeWhen ? item.activeWhen(pathname) : false;
          return (
            <Button
              key={item.label}
              asChild
              variant={active ? "secondary" : "ghost"}
              className="min-w-[160px] justify-start lg:min-w-0"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          );
        })}
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
