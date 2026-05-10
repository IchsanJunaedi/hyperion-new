'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Instagram, Menu, Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Brand } from './Brand';
import { useTheme } from './ThemeProvider';

export function ModeToggle() {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function Navbar() {
    const { auth } = usePage<SharedData>().props;
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Prevent hydration errors
    if (!isMounted) {
        return null;
    }

    return (
        <div className="flex w-full flex-col bg-white dark:bg-[#0A0A0A]">
            {/* Social Media Section */}
            <div className="border-b">
                <div className="container mx-auto flex max-w-7xl justify-end px-4 py-2">
                    <div className="flex items-center space-x-2">
                        <a href="https://www.instagram.com/hyperionteam.id/" target="_blank" className="dark:text-white">
                            <Instagram className="size-5" />
                            <span className="sr-only">Instagram</span>
                        </a>
                        <div className="ml-2 hidden md:block">
                            <ModeToggle />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <div className="border-b">
                <div className="container mx-auto max-w-7xl px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2">
                            <Brand className="size-12 md:size-16" />
                        </Link>

                        {/* Desktop Navigation Menu */}
                        <div className="hidden md:block">
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <Link href="/">
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>Home</NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Link href="/about">
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>About</NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Link href="/gallery">
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>Gallery</NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger className='mr-0'>Division</NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <ul className="grid w-96 gap-4 p-4">
                                                {divisions.map((division) => (
                                                    <ListItem key={division.title} title={division.title} href={division.href}></ListItem>
                                                ))}
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                    {auth.user && (
                                        <NavigationMenuItem>
                                            <a href="/admin">
                                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>Dashboard</NavigationMenuLink>
                                            </a>
                                        </NavigationMenuItem>
                                    )}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>

                        {/* Mobile Navigation Menu */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Menu className="size-6" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="p-5" side="right">
                                    <div className="mt-8 flex flex-col space-y-4">
                                        {auth.user && (
                                            <a href="/admin" className="text-lg font-medium">
                                                Dashboard
                                            </a>
                                        )}
                                        <Link href="/" className="text-lg font-medium">
                                            Home
                                        </Link>
                                        <Link href="/about" className="text-lg font-medium">
                                            About
                                        </Link>
                                        <Link href="/gallery" className="text-lg font-medium">
                                            Gallery
                                        </Link>
                                        <div className="space-y-3">
                                            <div className="text-lg font-medium">Division</div>
                                            <div className="space-y-2 pl-4">
                                                {divisions.map((division) => (
                                                    <Link
                                                        key={division.title}
                                                        href={division.href}
                                                        className="text-muted-foreground hover:text-foreground block text-md"
                                                    >
                                                        {division.title}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <div className="mb-2 text-lg font-medium">Theme</div>
                                            <ModeToggle />
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-4 leading-none no-underline transition-colors outline-none select-none',
                        className,
                    )}
                    {...props}
                >
                    <div className="text-md font-bold">{title}</div>
                </a>
            </NavigationMenuLink>
        </li>
    );
});
ListItem.displayName = 'ListItem';

const divisions = [
    {
        title: 'Mobile Legends: Bang Bang',
        href: '/divisions/mobile-legends',
    },
];
