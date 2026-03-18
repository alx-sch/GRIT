import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { GlobalSearch, GlobalSearchTrigger } from '@/features/search/GlobalSearch';
import { cn } from '@/lib/utils';
import { useBaseNavConfig } from '@/router';
import { useAuthStore } from '@/store/authStore';
import { chatStore } from '@/store/chatStore';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { NavRoute } from '@/types/navroute';
import { Calendar, Loader2, LogOut, Menu, MessageSquare, User, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatedUnderline } from '../ui/animatedUnderline';
import { UserAvatar } from '../ui/user-avatar';
import { Container } from './Container';
import { Logo } from '../common/logo';

export function Navbar() {
  const navConfig: NavRoute[] = [...useBaseNavConfig()];
  const isLoggedIn = useAuthStore((s) => !!s.token);
  const user = useCurrentUserStore((s) => s.user);
  const isAvatarTransitioning = useCurrentUserStore((s) => s.isAvatarTransitioning);
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
        <Link
          to="/"
          className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo
            className="h-6 md:h-8 w-auto text-foreground hover:opacity-80 transition-opacity"
            aria-label="Grit Home"
          />
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
                        <div className="relative">
                          <UserAvatar user={user ?? {}} size="xs" />
                          {/* Transitioning overlay */}
                          {isAvatarTransitioning && (
                            <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                              <Loader2 className="w-3 h-3 text-white animate-spin" />
                            </div>
                          )}
                        </div>
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

          {/* Mobile nav */}
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

            {isLoggedIn && <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
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
                    <>
                      {/* Profile subsection */}
                      <div className="border-t border-border pt-4 mt-2 flex flex-col gap-4">
                        {/* User identity header */}
                        <div className="flex items-center gap-3 px-2">
                          <div className="relative">
                            <UserAvatar user={user ?? {}} size="sm" />
                            {isAvatarTransitioning && (
                              <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              </div>
                            )}
                          </div>
                          <span className="font-semibold">{displayName}</span>
                        </div>

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

                        <SheetClose asChild>
                          <Link
                            to="/profile"
                            className={cn(
                              'text-xl font-bold px-2 py-2 transition-all flex items-center gap-2',
                              isActive('/profile')
                                ? 'bg-foreground text-background'
                                : 'hover:underline underline-offset-4'
                            )}
                          >
                            <User className="h-5 w-5" />
                            Profile
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            to="/profile/my-events"
                            className={cn(
                              'text-xl font-bold px-2 py-2 transition-all flex items-center gap-2',
                              isActive('/profile/my-events')
                                ? 'bg-foreground text-background'
                                : 'hover:underline underline-offset-4'
                            )}
                          >
                            <Calendar className="h-5 w-5" />
                            My Events
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            to="/profile/my-friends"
                            className={cn(
                              'text-xl font-bold px-2 py-2 transition-all flex items-center gap-2',
                              isActive('/profile/my-friends')
                                ? 'bg-foreground text-background'
                                : 'hover:underline underline-offset-4'
                            )}
                          >
                            <Users className="h-5 w-5" />
                            My Friends
                          </Link>
                        </SheetClose>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                          className="text-xl font-bold px-2 py-2 transition-all flex items-center gap-2 text-red-600 hover:underline underline-offset-4 text-left"
                        >
                          <LogOut className="h-5 w-5" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>}
          </div>
        </div>
      </Container>
    </div>
  );
}
