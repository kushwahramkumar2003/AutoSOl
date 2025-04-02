"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  BookOpen,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Bell,
  Home,
  BarChart3,
  FileText,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletConnect } from "./wallet-connect";

interface NavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
  children?: NavLink[];
}

interface NavbarProps {
  isAuthenticated?: boolean;
  userAvatar?: string;
  userName?: string;
  userInitials?: string;
  onLogout?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  notifications?: number;
}

export default function Navbar({
  isAuthenticated = false,
  userAvatar,
  userName = "User",
  userInitials = "U",
  onLogout,
  onSettingsClick,
  onProfileClick,
  notifications = 0,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Public navigation links
  const publicLinks: NavLink[] = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How It Works" },
    {
      href: "#",
      label: "Resources",
      children: [
        {
          href: "/docs",
          label: "Documentation",
          icon: <FileText className="w-4 h-4 mr-2" />,
        },
        {
          href: "/guides",
          label: "Guides",
          icon: <BookOpen className="w-4 h-4 mr-2" />,
        },
        {
          href: "/help",
          label: "FAQs",
          icon: <HelpCircle className="w-4 h-4 mr-2" />,
        },
      ],
    },
    { href: "/#pricing", label: "Pricing" },
  ];

  // Authenticated navigation links
  const authLinks: NavLink[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <Home className="w-4 h-4 mr-2" />,
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: <BarChart3 className="w-4 h-4 mr-2" />,
    },
    {
      href: "#",
      label: "Resources",
      icon: <FileText className="w-4 h-4 mr-2" />,
      children: [
        {
          href: "/docs",
          label: "Documentation",
          icon: <FileText className="w-4 h-4 mr-2" />,
        },
        {
          href: "/guides",
          label: "Guides",
          icon: <BookOpen className="w-4 h-4 mr-2" />,
        },
        {
          href: "/help",
          label: "Help Center",
          icon: <HelpCircle className="w-4 h-4 mr-2" />,
        },
      ],
    },
  ];

  const navLinks = isAuthenticated ? authLinks : publicLinks;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if the current path matches a nav link
  const isActive = (href: string) => {
    if (href.startsWith("/#")) {
      return pathname === "/" && href !== "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/40 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:shadow-blue-500/40 group-hover:scale-105">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-foreground font-space gradient-text">
              AutoSOL
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Smart Contract Automation
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              {navLinks.map((link) =>
                link.children ? (
                  <NavigationMenuItem key={link.label}>
                    <NavigationMenuTrigger
                      className={cn(
                        "text-sm bg-transparent",
                        isActive(link.href)
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {link.children.map((childLink) => (
                          <li key={childLink.label}>
                            <Link href={childLink.href} passHref legacyBehavior>
                              <NavigationMenuLink
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  isActive(childLink.href) ? "bg-accent/50" : ""
                                )}
                              >
                                <div className="flex items-center">
                                  {childLink.icon}
                                  <div className="text-sm font-medium leading-none">
                                    {childLink.label}
                                  </div>
                                </div>
                              </NavigationMenuLink>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={link.label}>
                    <Link href={link.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "text-sm bg-transparent",
                          isActive(link.href)
                            ? "text-foreground bg-accent/30"
                            : "text-muted-foreground"
                        )}
                      >
                        <span className="flex items-center">
                          {link.icon}
                          {link.label}
                        </span>
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Notification icon */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {notifications > 9 ? "9+" : notifications}
                  </span>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 hover:bg-transparent">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-purple-600 text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium">{userName}</p>
                        <p className="text-xs text-muted-foreground">Account</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onProfileClick}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSettingsClick}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="border-border/60 text-foreground hover:bg-muted hover:text-foreground hover:border-blue-500/30 transition-all focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-lg"
                asChild
              >
                <Link href="/docs">
                  <BookOpen className="mr-2 h-4 w-4 text-blue-400" />
                  Documentation
                </Link>
              </Button>

              <WalletConnect />
            </>
          )}
        </div>

        {/* Mobile Menu Button and Sheet */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground hover:bg-muted rounded-lg"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="lg:hidden p-0 w-80">
            <SheetHeader className="p-6 border-b">
              <SheetTitle>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xl text-foreground font-space gradient-text">
                      AutoSOL
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Smart Contract Automation
                    </span>
                  </div>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="px-6 py-4">
              {isAuthenticated && (
                <div className="flex items-center gap-3 p-4 mb-2 bg-muted/50 rounded-lg">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-purple-600 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">Account</p>
                  </div>
                </div>
              )}

              <nav className="flex flex-col gap-1 py-2">
                {navLinks.map((link) =>
                  link.children ? (
                    <div key={link.label} className="mb-2">
                      <div className="flex items-center px-4 py-2 text-sm font-medium text-foreground">
                        {link.icon}
                        {link.label}
                      </div>
                      <div className="ml-4 border-l border-border/50 pl-4 mt-1">
                        {link.children.map((childLink) => (
                          <Link
                            key={childLink.label}
                            href={childLink.href}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                              isActive(childLink.href)
                                ? "bg-accent text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {childLink.icon}
                            {childLink.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                        isActive(link.href)
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  )
                )}
              </nav>
            </div>

            <div className="border-t border-border/30 p-6 mt-auto">
              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      onSettingsClick?.();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button
                    variant="destructive"
                    className="justify-start"
                    onClick={() => {
                      onLogout?.();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button variant="outline" className="w-full" asChild>
                    <Link
                      href="/docs"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BookOpen className="mr-2 h-4 w-4 text-blue-400" />
                      Documentation
                    </Link>
                  </Button>
                  <WalletConnect />
                </div>
              )}

              <div className="flex justify-center mt-6">
                <div className="flex gap-5">
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-blue-400 transition-all"
                  >
                    <span className="sr-only">Twitter</span>
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                    >
                      <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-purple-400 transition-all"
                  >
                    <span className="sr-only">GitHub</span>
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                    >
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                  </a>
                  <a
                    href="https://discord.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-blue-500 transition-all"
                  >
                    <span className="sr-only">Discord</span>
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
