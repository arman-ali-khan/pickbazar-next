'use client';

import Link from 'next/link';
import { Home, Search, Menu, User, ShoppingCart, ChevronDown, Apple, Beef, Cookie, Dog, Home as HomeIcon, Milk, Soup, Cake, GlassWater, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { LoginDialog } from '@/components/login-dialog';
import { useUI } from '@/contexts/ui-context';
import { useCart } from '@/contexts/cart-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

const NavItem = ({ children, href = "#" }: { children: React.ReactNode, href?: string }) => (
    <Link
      href={href}
      className="transition-colors hover:text-primary text-sm font-medium text-gray-600 block py-2"
    >
      {children}
    </Link>
  );

const categories = [
    { name: 'Fruits & Vegetables', icon: Apple, sub: ['Fruits', 'Vegetables'] },
    { name: 'Meat & Fish', icon: Beef, sub: ['Meat', 'Fish'] },
    { name: 'Snacks', icon: Cookie, sub: ['Chips', 'Chocolate'] },
    { name: 'Pet Care', icon: Dog, sub: ['Dog Food', 'Cat Food'] },
    { name: 'Home & Cleaning', icon: HomeIcon, sub: ['Detergent', 'Cleaning Tools'] },
    { name: 'Dairy', icon: Milk, sub: ['Milk', 'Cheese'] },
    { name: 'Cooking', icon: Soup, sub: ['Oil', 'Spices'] },
    { name: 'Breakfast', icon: Cake, sub: ['Cereal', 'Bread'] },
    { name: 'Beverage', icon: GlassWater, sub: ['Coffee', 'Juice'] },
];

const navItems = [{ name: 'Shop', href: '/shop' }, { name: 'Offers', href: '/offers' }, { name: 'Contact', href: '/contact' }];

function PagesDrawer() {
    const { user } = useUser();
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="flex flex-col h-full rounded-none text-muted-foreground p-2">
                    <Menu className="h-6 w-6" />
                    <span className="text-xs">Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
                <SheetTitle className="sr-only">Pages Menu</SheetTitle>
                <div className="p-6">
                    <Link href="/" className="mr-6 flex items-center space-x-2 mb-6">
                      <Leaf className="h-7 w-7 text-primary" />
                      <h1 className="text-2xl font-bold text-gray-800">Pickbazar</h1>
                    </Link>
                  <div className="flex flex-col space-y-4">
                     <Accordion type="multiple" className="w-full -my-2">
                        <AccordionItem value="categories" className="border-b-0">
                            <AccordionTrigger className="py-2 text-sm font-medium text-gray-600 hover:text-primary hover:no-underline flex justify-between w-full">
                                Categories
                            </AccordionTrigger>
                            <AccordionContent>
                                <Accordion type="multiple" className="ml-4">
                                {categories.map((category) => (
                                    <AccordionItem value={category.name} key={category.name} className="border-b-0">
                                        <AccordionTrigger className="py-2 hover:no-underline">
                                            <div className="flex items-center gap-2 text-sm">
                                                <category.icon className="h-4 w-4" />
                                                <span>{category.name}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pl-4 flex flex-col items-start">
                                            {category.sub.map((subCategory) => (
                                                <Link href={`/shop?category=${subCategory}`} key={subCategory} className="py-2 text-sm text-muted-foreground hover:text-primary">{subCategory}</Link>
                                            ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                                </Accordion>
                            </AccordionContent>
                        </AccordionItem>
                     </Accordion>
                    {navItems.map((item) => (
                      <NavItem key={item.name} href={item.href}>{item.name}</NavItem>
                    ))}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-primary text-sm font-medium text-gray-600">
                            Pages
                            <ChevronDown className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem asChild><Link href="/about">About Us</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/contact">Contact Us</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/faq">FAQ</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/privacy-policy">Privacy Policy</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/terms-and-conditions">Terms & Conditions</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="mt-4 flex flex-col gap-2">
                        {!user && (
                          <Dialog>
                              <DialogTrigger asChild>
                                  <Button>Join</Button>
                              </DialogTrigger>
                              <LoginDialog />
                          </Dialog>
                        )}
                        <Button asChild>
                            <Link href="/invest">Become an Investor</Link>
                        </Button>
                    </div>
                  </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default function BottomNavbar() {
    const { toggleSearch } = useUI();
    const { openCart, totalItems } = useCart();
    const { user } = useUser();
    const router = useRouter();

    const handleProfileClick = () => {
        if (user) {
            router.push('/profile');
        }
    }

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t md:hidden">
            <div className="grid h-full grid-cols-5 mx-auto">
                <PagesDrawer />

                <Button variant="ghost" className="flex flex-col h-full rounded-none text-muted-foreground p-2" onClick={toggleSearch}>
                    <Search className="h-6 w-6" />
                    <span className="text-xs">Search</span>
                </Button>

                <Link href="/" className="inline-flex flex-col items-center justify-center p-2 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <div className="w-14 h-14 -mt-8 flex items-center justify-center rounded-full bg-primary text-white shadow-lg">
                        <Home className="h-7 w-7" />
                    </div>
                    <span className="sr-only">Home</span>
                </Link>

                {user ? (
                    <Button variant="ghost" className="flex flex-col h-full rounded-none text-muted-foreground p-2" onClick={handleProfileClick}>
                        <User className="h-6 w-6" />
                        <span className="text-xs">Profile</span>
                    </Button>
                ) : (
                    <Dialog>
                        <DialogTrigger asChild>
                             <Button variant="ghost" className="flex flex-col h-full rounded-none text-muted-foreground p-2">
                                <User className="h-6 w-6" />
                                <span className="text-xs">Profile</span>
                            </Button>
                        </DialogTrigger>
                        <LoginDialog />
                    </Dialog>
                )}


                <Button id="cart-icon-mobile" variant="ghost" className="relative flex flex-col h-full rounded-none text-muted-foreground p-2" onClick={openCart}>
                    <ShoppingCart className="h-6 w-6" />
                    <span className="text-xs">Cart</span>
                    {totalItems > 0 && (
                        <span className="absolute top-1 right-3.5 text-xs bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                            {totalItems}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
