'use client';

import Link from 'next/link';
import { ChevronDown, Menu, Search, Apple, Leaf, X, Beef, Cookie, Dog, Home, Milk, Soup, Cake, GlassWater } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { LoginDialog } from '@/components/login-dialog';
import { Input } from './ui/input';
import { useUI } from '@/contexts/ui-context';

const NavItem = ({ children, href = "#" }: { children: React.ReactNode, href?: string }) => (
  <Link
    href={href}
    className="transition-colors hover:text-primary text-sm font-medium text-gray-600"
  >
    {children}
  </Link>
);

const categories = [
    { name: 'Fruits & Vegetables', icon: Apple, sub: ['Fruits', 'Vegetables'] },
    { name: 'Meat & Fish', icon: Beef, sub: ['Meat', 'Fish'] },
    { name: 'Snacks', icon: Cookie, sub: ['Chips', 'Chocolate'] },
    { name: 'Pet Care', icon: Dog, sub: ['Dog Food', 'Cat Food'] },
    { name: 'Home & Cleaning', icon: Home, sub: ['Detergent', 'Cleaning Tools'] },
    { name: 'Dairy', icon: Milk, sub: ['Milk', 'Cheese'] },
    { name: 'Cooking', icon: Soup, sub: ['Oil', 'Spices'] },
    { name: 'Breakfast', icon: Cake, sub: ['Cereal', 'Bread'] },
    { name: 'Beverage', icon: GlassWater, sub: ['Coffee', 'Juice'] },
];

export default function Header() {
  const { isSearchOpen, setSearchOpen } = useUI();
  const navItems = ['Shops', 'Offers', 'Contact'];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-20 items-center">
        {isSearchOpen ? (
           <div className="flex w-full items-center gap-2">
            <div className="flex w-full items-center rounded-lg border-2 border-primary bg-white">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search your products from here"
                      className="h-12 w-full border-0 bg-transparent pl-12 pr-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                      autoFocus
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 flex-shrink-0 rounded-l-none rounded-r-md text-muted-foreground hover:bg-primary/10"
                    onClick={() => setSearchOpen(false)}
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <Leaf className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-bold text-gray-800">PickBazar</h1>
              </Link>
              <div className="hidden md:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 border-gray-200">
                      <Menu className="h-4 w-4" />
                      Categories
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {categories.map((category) => (
                        <DropdownMenuSub key={category.name}>
                          <DropdownMenuSubTrigger>
                            <category.icon className="mr-2 h-4 w-4" />
                            <span>{category.name}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {category.sub.map((subCategory) => (
                                <DropdownMenuItem key={subCategory}>
                                  {subCategory}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                    ))}
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
                <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                    <Search className="h-5 w-5" />
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Join</Button>
                    </DialogTrigger>
                    <LoginDialog />
                  </Dialog>
                  <Button asChild>
                    <Link href="/invest">Become an Investor</Link>
                  </Button>
              </div>
              <div className="md:hidden">
                <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                    <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
