'use client';

import Link from 'next/link';
import { ChevronDown, Menu, Search, Leaf, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { LoginDialog } from '@/components/login-dialog';
import { Input } from './ui/input';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { categoryData as categories } from '@/lib/category-data';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setSearchOpen } from '@/lib/redux/slices/uiSlice';


const NavItem = ({ children, href = "#" }: { children: React.ReactNode, href?: string }) => (
  <Link
    href={href}
    className="transition-colors hover:text-primary text-sm font-medium text-gray-600"
  >
    {children}
  </Link>
);

const CategoriesNav = () => {
    const isMobile = useIsMobile();

    const categoriesContent = (
      <Accordion type="multiple" className="w-full">
        {categories.map((category) => (
          <AccordionItem value={category.name} key={category.name} className="border-b last:border-b-0">
            <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <category.icon className="h-5 w-5" />
                <span>{category.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-8 flex flex-col items-start">
                {category.sub.map((subCategory) => (
                  <Link href={subCategory.href} key={subCategory.name} className="py-2 text-sm text-muted-foreground hover:text-primary w-full text-left">{subCategory.name}</Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );

    if (isMobile) {
        return (
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Categories</SheetTitle>
                    </SheetHeader>
                    <div className="p-2">
                        {categoriesContent}
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Menu className="h-5 w-5" />
                    Categories
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-2 max-h-[calc(80vh)] overflow-y-auto">
                {categoriesContent}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default function Header() {
  const dispatch = useAppDispatch();
  const isSearchOpen = useAppSelector(state => state.ui.isSearchOpen);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const navItems = [{ name: 'Shop', href: '/shop' }, { name: 'Offers', href: '/offers' }, { name: 'Contact', href: '/contact' }];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
       toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
      });
    }
  };


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      dispatch(setSearchOpen(false));
      setSearchTerm('');
    }
  };


  return (
    <header className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        isScrolled ? 'bg-white border-gray-200 shadow-sm' : 'bg-transparent border-transparent'
    )}>
      <div className="container flex h-20 items-center justify-between">
        {isSearchOpen ? (
           <div className="flex w-full items-center gap-2">
            <form onSubmit={handleSearch} className="flex w-full items-center rounded-lg border-2 border-primary bg-white">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search your products from here"
                      className="h-12 w-full border-0 bg-transparent pl-12 pr-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                      autoFocus
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 flex-shrink-0 rounded-l-none rounded-r-md text-muted-foreground hover:bg-primary/10"
                    onClick={() => dispatch(setSearchOpen(false))}
                    type="button"
                >
                    <X className="h-5 w-5" />
                </Button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
                <div className="md:hidden">
                    <CategoriesNav />
                </div>
                <div className={cn(
                    "hidden md:block transition-opacity duration-300",
                    isScrolled ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                    <CategoriesNav />
                </div>
              <Link href="/" className="flex items-center gap-2">
                <Leaf className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-bold text-gray-800">PickBazar</h1>
              </Link>
            </div>

            <nav className="hidden items-center space-x-6 text-sm md:flex">
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
            </nav>

            <div className="flex items-center justify-end space-x-2">
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => dispatch(setSearchOpen(true))}>
                    <Search className="h-5 w-5" />
                </Button>
                {user ? (
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar>
                          <AvatarImage src={user.photoURL || 'https://picsum.photos/seed/profile/200'} alt={user.displayName || 'User'} />
                          <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
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
              <div className="md:hidden flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => dispatch(setSearchOpen(true))}>
                    <Search className="h-5 w-5" />
                </Button>
                 <Button asChild>
                    <Link href="/invest">Invest</Link>
                  </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
