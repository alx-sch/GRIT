import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; // 1. Import X icon
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

export function Navbar() {
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/users', label: 'Users' },
    { href: '/design', label: 'Design' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="border-b-2 border-black p-4 flex justify-between items-center bg-background sticky top-0 z-50">
      <div className="font-bold text-xl px-4 uppercase tracking-wider">Grit</div>

      <div className="hidden md:block">
        <NavigationMenu>
          <NavigationMenuList className="gap-2">
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.label}>
                <NavigationMenuLink asChild>
                  <Link
                    to={link.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      'bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent data-active:bg-transparent data-[state=open]:bg-transparent',
                      'rounded-none',
                      'text-base font-bold h-auto py-2 px-4',
                      isActive(link.href)
                        ? 'border-b-2 border-black text-black'
                        : 'border-b-2 border-transparent hover:border-black/50'
                    )}
                  >
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-75 border-l-2 border-black sm:w-100 [&>button]:hidden"
          >
            <SheetHeader className="flex flex-row items-center justify-between border-b-2 border-black pb-4 mb-4 space-y-0 text-left">
              <SheetTitle className="font-bold uppercase tracking-wider">Menu</SheetTitle>

              <SheetClose asChild>
                <button className="focus:outline-none focus:ring-0 hover:opacity-70 transition-opacity">
                  <X className="h-8 w-8 text-black" strokeWidth={3} />
                  <span className="sr-only">Close</span>
                </button>
              </SheetClose>
            </SheetHeader>

            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.label}>
                  <Link
                    to={link.href}
                    className={cn(
                      'text-xl font-bold px-2 py-2 transition-all',
                      isActive(link.href)
                        ? 'bg-black text-white'
                        : 'hover:underline underline-offset-4'
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
