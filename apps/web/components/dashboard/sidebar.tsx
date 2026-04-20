"use client";

import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarClock, CalendarDays, ArrowLeftRight, Plus, Zap, ShieldCheck, ReceiptText, Settings2, Vault } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { usePrivilegedAccess } from "@/hooks/use-privileged-access";

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { open, setOpen, isMobile } = useSidebar();
  const { isAdmin, isFeeCollector, canInitialize } = usePrivilegedAccess();

  const isActive = (path: string) => pathname === path;

  // Auto-close on mobile when route changes
  useEffect(() => {
    if (isMobile) setOpen(false);
  }, [pathname, isMobile, setOpen]);

  const navItems = [
    { title: "Dashboard",          icon: LayoutDashboard, href: "/dashboard" },
    { title: "Payments",           icon: CalendarClock,   href: "/dashboard/payments" },
    { title: "Commitments",        icon: ShieldCheck,     href: "/dashboard/commitments" },
    { title: "Requests",           icon: ReceiptText,     href: "/dashboard/requests" },
    { title: "Calendar",           icon: CalendarDays,    href: "/dashboard/payments/calendar" },
    { title: "Transactions",       icon: ArrowLeftRight,  href: "/dashboard/transactions" },
    ...(isAdmin || canInitialize
      ? [{ title: "Admin", icon: Settings2, href: "/dashboard/admin" }]
      : []),
    ...(isFeeCollector
      ? [{ title: "Fee Collector", icon: Vault, href: "/dashboard/fee-collector" }]
      : []),
  ];

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-white/[0.06] bg-black/90 backdrop-blur-xl"
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04]"
            aria-hidden="true"
          >
            <Zap className="h-4 w-4 text-primary" />
          </div>

          {open && (
            <span className="font-bold text-base tracking-tight text-white font-space">
              AutoSOL
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button
                  variant="outline"
                  className="flex w-full items-center justify-start rounded-2xl border-white/[0.07] bg-white/[0.03] transition-all hover:bg-white/[0.06] hover:text-white"
                  onClick={() => router.push("/dashboard/payments/new")}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  {open && <span className="ml-2">New Payment</span>}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
