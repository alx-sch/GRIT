import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Calendar, ChevronDown, Users, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBaseNavConfig } from '@/router';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { NavRoute } from '@/types/navroute';
import { UserAvatar } from '../ui/user-avatar';
import { AnimatedUnderline } from '../ui/animatedUnderline';
import { chatStore } from '@/store/chatStore';
import { useState } from 'react';
import { Container } from './Container';
import { GlobalSearch, GlobalSearchTrigger } from '@/features/search/GlobalSearch';

export function Navbar() {
  const navConfig: NavRoute[] = [...useBaseNavConfig()];
  const isLoggedIn = useAuthStore((s) => !!s.token);
  const user = useCurrentUserStore((s) => s.user);
  const displayName = user?.name ?? user?.email ?? 'User';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const conversations = chatStore((s) => s.conversations);

  const hasUnread = Object.values(conversations).some((conv) => {
    if (!conv.lastMessage) return false;
    if (!conv.lastReadAt) return true;

    return new Date(conv.lastReadAt) < new Date(conv.lastMessage.createdAt);
  });

  if (!isLoggedIn) {
    navConfig.push({ path: '/login', label: 'Login' });
  }

  const location = useLocation();
  const isActive = (path: string) => {
    // For /chat, match if pathname starts with /chat (to handle /chat/:id routes)
    if (path === '/chat') {
      return location.pathname.startsWith('/chat');
    }
    return location.pathname === path;
  };
  const navigate = useNavigate();

  const handleLogout = () => {
    useAuthStore.getState().clearAuthenticated();
    useCurrentUserStore.getState().clearUser();
    void navigate('/login');
  };

  return (
    <div className="border-b-2 border-border bg-card sticky top-0 z-50 py-4">
      <Container className="flex justify-between items-center">
        <Link to="/">
          <div className="font-bold text-xl uppercase tracking-wider">Grit</div>
        </Link>

        {/* Right-side controls — GlobalSearch dialog rendered once to avoid duplicate keyboard listeners */}
        <div className="flex items-center gap-2">
          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

          {/* Desktop-only nav */}
          <div className="hidden md:flex items-center gap-4">
            <NavigationMenu>
              <NavigationMenuList className="gap-2 my-0 ml-0">
                {navConfig
                  .filter((link) => link.label !== 'Login')
                  .map((link) => (
                    <NavigationMenuItem key={link.label} className="list-none">
                      <NavigationMenuLink asChild className="p-0">
                        <Link
                          to={link.path}
                          className={cn(
                            navigationMenuTriggerStyle(),
                            'relative bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent',
                            'rounded-none text-base font-bold h-auto px-4 pb-1',
                            isActive(link.path) ? 'text-foreground' : ''
                          )}
                        >
                          {link.label}
                          <AnimatedUnderline isActive={isActive(link.path)} />
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
              </NavigationMenuList>
            </NavigationMenu>
            <GlobalSearchTrigger
              onClick={() => {
                setSearchOpen(true);
              }}
            />
            {!isLoggedIn && (
              <Link to="/login">
                <Button className="text-base font-bold">Login</Button>
              </Link>
            )}
            {isLoggedIn && (
              <>
                <div className="relative group">
                  <Link
                    to="/chat"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      'relative bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent',
                      'rounded-none text-base font-bold h-auto px-4 pb-1',
                      'flex items-center justify-center',
                      isActive('/chat') ? 'text-foreground' : ''
                    )}
                    aria-label="Chat"
                  >
                    <MessageSquare className="h-6 w-6" strokeWidth={2.5} />
                    {hasUnread && (
                      <div className="absolute top-1 right-1 bg-primary w-2 h-2 rounded-full border border-card"></div>
                    )}
                  </Link>
                  <AnimatedUnderline isActive={location.pathname.startsWith('/chat')} />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="relative group">
                      <button
                        className={cn(
                          navigationMenuTriggerStyle(),
                          'relative bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent',
                          'rounded-none text-base font-bold h-auto px-4 pb-1',
                          'flex items-center gap-2 cursor-pointer',
                          isActive('/profile') ? 'text-foreground' : ''
                        )}
                      >
                        <UserAvatar user={user ?? {}} size="xs" />
                        <span className="normal-case">{displayName}</span>
                      </button>
                      <AnimatedUnderline
                        isActive={location.pathname.startsWith('/profile')}
                        className="pointer-events-none"
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => void navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void navigate('/profile/my-events')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      My events
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void navigate('/profile/my-friends')}>
                      <Users className="mr-2 h-4 w-4" />
                      My friends
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <GlobalSearchTrigger
              variant="mobile"
              onClick={() => {
                setSearchOpen(true);
              }}
            />
            {!isLoggedIn && (
              <Link to="/login">
                <Button className="h-10">Login</Button>
              </Link>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-75 border-l-2 border-border sm:w-100 [&>button]:hidden"
              >
                {isLoggedIn && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border cursor-pointer">
                        <UserAvatar user={user ?? {}} size="sm" />
                        <div className="flex flex-col flex-1">
                          <span className="font-semibold">{displayName}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          setMobileMenuOpen(false);
                          void navigate('/profile');
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setMobileMenuOpen(false);
                          void navigate('/profile/my-events');
                        }}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        My events
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setMobileMenuOpen(false);
                          void navigate('/profile/my-friends');
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        My friends
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <SheetHeader className="flex flex-row items-center justify-between pb-4 mb-4 space-y-0 text-left -mt-2">
                  <SheetTitle className="font-bold uppercase tracking-wider">Menu</SheetTitle>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-8 w-8" strokeWidth={3} />
                      <span className="sr-only">Close</span>
                    </Button>
                  </SheetClose>
                </SheetHeader>

                <div className="flex flex-col gap-4">
                  {navConfig
                    .filter((link) => !['Login', 'Logout'].includes(link.label))
                    .map((link) => (
                      <SheetClose asChild key={link.label}>
                        <Link
                          to={link.path}
                          className={cn(
                            'text-xl font-bold px-2 py-2 transition-all',
                            isActive(link.path)
                              ? 'bg-foreground text-background'
                              : 'hover:underline underline-offset-4'
                          )}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  {isLoggedIn && (
                    <SheetClose asChild>
                      <Link
                        to="/chat"
                        className={cn(
                          'text-xl font-bold px-2 py-2 transition-all relative',
                          location.pathname.startsWith('/chat')
                            ? 'bg-foreground text-background'
                            : 'hover:underline underline-offset-4'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Chat
                          {hasUnread && <div className="bg-primary w-2 h-2 rounded-full"></div>}
                        </span>
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </div>
  );
}
