import Link from 'next/link';
import { ChevronDown, Menu, Search, User, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


const NavItem = ({ children, href = "#" }: { children: React.ReactNode, href?: string }) => (
  <Link
    href={href}
    className="transition-colors hover:text-primary text-foreground/80 font-medium"
  >
    {children}
  </Link>
);

const NavDropdown = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="p-0 h-auto hover:bg-transparent flex items-center gap-1 transition-colors hover:text-primary text-foreground/80 font-medium">
        {title}
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);


export default function Header() {
  const navItems = ['Shops', 'Offers', 'Contact'];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-20 items-center">
        <div className="mr-auto flex items-center">
          <Link href="/" className="mr-8">
            <h1 className="text-2xl font-bold text-primary">Pickbazar</h1>
          </Link>
          <nav className="hidden items-center space-x-6 text-sm md:flex">
             <NavDropdown title="Grocery">
                <DropdownMenuItem>Fruits & Vegetables</DropdownMenuItem>
                <DropdownMenuItem>Meat & Fish</DropdownMenuItem>
                <DropdownMenuItem>Dairy</DropdownMenuItem>
             </NavDropdown>
            {navItems.map((item) => (
              <NavItem key={item}>{item}</NavItem>
            ))}
             <NavDropdown title="Pages">
                <DropdownMenuItem>About Us</DropdownMenuItem>
                <DropdownMenuItem>Contact Us</DropdownMenuItem>
                <DropdownMenuItem>FAQ</DropdownMenuItem>
              </NavDropdown>
          </nav>
        </div>


        <div className="flex items-center justify-end space-x-4">
           <div className="hidden md:flex items-center space-x-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar>
                            <AvatarImage src="https://picsum.photos/seed/user/100/100" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>My Account</DropdownMenuItem>
                    <DropdownMenuItem>Order History</DropdownMenuItem>
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
                   <h1 className="text-2xl font-bold text-primary">Pickbazar</h1>
                </Link>
              <div className="flex flex-col space-y-4">
                <NavDropdown title="Grocery">
                    <DropdownMenuItem>Fruits & Vegetables</DropdownMenuItem>
                    <DropdownMenuItem>Meat & Fish</DropdownMenuItem>
                    <DropdownMenuItem>Dairy</DropdownMenuItem>
                </NavDropdown>
                {navItems.map((item) => (
                  <NavItem key={item}>{item}</NavItem>
                ))}
                 <NavDropdown title="Pages">
                    <DropdownMenuItem>About Us</DropdownMenuItem>
                    <DropdownMenuItem>Contact Us</DropdownMenuItem>
                    <DropdownMenuItem>FAQ</DropdownMenuItem>
                </NavDropdown>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
