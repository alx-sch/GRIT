import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
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
import { useTheme } from '@/providers/theme-provider';
import { navConfig } from '@/router';

export function Navbar() {
  const location = useLocation();
  const { setTheme, resolvedTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="border-b-2 border-border py-4 px-8 md:px-12 flex justify-between items-center bg-card sticky top-0 z-50">
      <Link to="/">
        <div className="font-bold text-xl  uppercase tracking-wider">Grit</div>
      </Link>

      <div className="hidden md:flex items-center gap-4">
        <NavigationMenu>
          <NavigationMenuList className="gap-2 my-0 ml-0">
            {navConfig.map((link) => (
              <NavigationMenuItem key={link.label}>
                <NavigationMenuLink asChild className="p-0">
                  <Link
                    to={link.path}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      'bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent',
                      'rounded-none text-base font-bold h-auto  px-4 border-b-2 ',
                      isActive(link.path)
                        ? 'border-foreground text-foreground'
                        : 'border-transparent hover:border-foreground/50'
                    )}
                  >
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="hover:bg-accent hover:text-accent-foreground"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="md:hidden flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:bg-accent">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Sheet>
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
            <SheetHeader className="flex flex-row items-center justify-between border-b-2 border-border pb-4 mb-4 space-y-0 text-left">
              <SheetTitle className="font-bold uppercase tracking-wider">Menu</SheetTitle>
              <SheetClose asChild>
                <button className="focus:outline-none hover:opacity-70 transition-opacity">
                  <X className="h-8 w-8 text-foreground" strokeWidth={3} />
                  <span className="sr-only">Close</span>
                </button>
              </SheetClose>
            </SheetHeader>

            <div className="flex flex-col gap-4">
              {navConfig.map((link) => (
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
