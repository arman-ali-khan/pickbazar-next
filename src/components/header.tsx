import Link from 'next/link';
import { ChevronDown, Menu, Search, Apple, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { LoginDialog } from '@/components/login-dialog';

const NavItem = ({ children, href = "#" }: { children: React.ReactNode, href?: string }) => (
  <Link
    href={href}
    className="transition-colors hover:text-primary text-sm font-medium text-gray-600"
  >
    {children}
  </Link>
);

export default function Header() {
  const navItems = ['Shops', 'Offers', 'Contact'];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-20 items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-gray-800">PickBazar</h1>
          </Link>
          <div className="hidden md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-gray-200">
                  <Apple className="h-4 w-4" />
                  Grocery
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Fruits & Vegetables</DropdownMenuItem>
                <DropdownMenuItem>Meat & Fish</DropdownMenuItem>
                <DropdownMenuItem>Dairy</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav className="ml-auto hidden items-center space-x-6 text-sm md:flex">
            {navItems.map((item) => (
              <NavItem key={item}>{item}</NavItem>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-primary text-sm font-medium text-gray-600">
                Pages
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>About Us</DropdownMenuItem>
                <DropdownMenuItem>Contact Us</DropdownMenuItem>
                <DropdownMenuItem>FAQ</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </nav>

        <div className="flex items-center justify-end space-x-2 ml-6">
           <div className="hidden md:flex items-center space-x-2">
             <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
             </Button>
             <Dialog>
                <DialogTrigger asChild>
                    <Button>Join</Button>
                </DialogTrigger>
                <LoginDialog />
              </Dialog>
             <Button>Become a Seller</Button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <Link href="/" className="mr-6 flex items-center space-x-2 mb-6">
                   <Leaf className="h-7 w-7 text-primary" />
                   <h1 className="text-2xl font-bold text-gray-800">Pickbazar</h1>
                </Link>
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <NavItem key={item}>{item}</NavItem>
                ))}
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-primary text-sm font-medium text-gray-600">
                        Pages
                        <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>About Us</DropdownMenuItem>
                        <DropdownMenuItem>Contact Us</DropdownMenuItem>
                        <DropdownMenuItem>FAQ</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="mt-4 flex flex-col gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Join</Button>
                        </DialogTrigger>
                        <LoginDialog />
                    </Dialog>
                    <Button>Become a Seller</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
