'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import {
  Menu, ShieldCheck, LayoutDashboard, Key, Activity,
  Settings, LogOut, User
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const dashboardLinks = [
  { name: 'Dashboard',  href: '/dashboard',           icon: LayoutDashboard },
  { name: 'API Keys',   href: '/dashboard/keys',       icon: Key },
  { name: 'Analytics',  href: '/dashboard/analytics',  icon: Activity },
  { name: 'Playground', href: '/dashboard/playground', icon: Activity },
  { name: 'Settings',   href: '/dashboard/settings',   icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = React.useState(false)

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"
  const activeLinks = isAuthenticated ? dashboardLinks : []

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md font-sans"
    >
      <div className="flex h-16 items-center px-4 md:px-8 max-w-[1400px] mx-auto">

        {/* Mobile Menu — only when authenticated */}
        {isAuthenticated && (
          <div className="flex items-center md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 text-muted-foreground hover:text-foreground">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-r border-border bg-background">
                <SheetHeader className="p-6 border-b border-border text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-semibold tracking-tight text-foreground">FairDecision</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4 px-3 space-y-1">
                  {activeLinks.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
                <div className="absolute bottom-0 w-full p-4 border-t border-border bg-muted/30">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Brand — shield icon only, no text */}
        <Link href="/" className="flex items-center gap-2.5 ml-4 md:ml-0 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-sm"
          >
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </motion.div>
        </Link>

        {/* Desktop Nav Links — only when authenticated */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center ml-10 space-x-2">
            {!isLoading && activeLinks.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative px-3 py-2 rounded-md text-sm font-medium"
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-accent rounded-md z-0"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                    />
                  )}
                  <span className={`relative z-10 transition-colors duration-200 ${
                    isActive ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        )}

        {/* Right Side — avatar only, no Sign In / Get Started */}
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          {isLoading && (
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          )}

          {!isLoading && isAuthenticated && (
            <>
              <div className="hidden md:flex items-center gap-2 mr-2 bg-muted/50 px-2.5 py-1 rounded-full border border-border">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">Operational</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-2 ring-transparent hover:ring-border p-0 transition-all">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {session?.user?.name?.charAt(0) || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{session?.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer text-foreground">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer text-foreground">
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}