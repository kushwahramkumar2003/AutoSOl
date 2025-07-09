"use client";

import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  ArrowLeftRight,
  Plus,

} from "lucide-react";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { open } = useSidebar();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "Recurring Payments",
      icon: CalendarClock,
      href: "/dashboard/payments",
    },
    {
      title: "Transactions",
      icon: ArrowLeftRight,
      href: "/dashboard/transactions",
    },
  ];

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-sidebar-border"
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          {open && (
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#6E56CF] to-[#10B981] flex items-center justify-center shadow-neon">
              <span className="text-white font-bold text-xs">A</span>
            </div>
          )}
          {open && (
            <span className="font-bold text-lg text-white font-space">
              AutoSOL
            </span>
          )}

          <SidebarTrigger className="ml-auto" />
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
                      <item.icon className="h-5 w-5" />
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
                  className="flex justify-center items-center w-full shadow-neon"
                  onClick={() => {
                    router.push("/dashboard/payments/new");
                  }}
                >
                  <Plus className="h-4 w-4 " />
                  {open && "New Payment"}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
