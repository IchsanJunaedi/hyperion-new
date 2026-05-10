import { Link } from '@inertiajs/react';
import { Instagram } from 'lucide-react';
import { Brand } from './Brand';

export function Footer() {
    return (
        <footer className="bg-dark text-muted-foreground mx-auto w-full max-w-7xl">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                    {/* Logo */}
                    <div className="md:col-span-3 lg:col-span-2">
                        <Link href="/" className="flex items-center">
                            <Brand className="mr-2 size-14" />
                            <span className="text-primary text-xl font-bold">Hyperion Team</span>
                        </Link>
                    </div>

                    {/* Navigation Columns */}
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:col-span-8 md:ml-8">
                        {/* Column 1 */}
                        <div className="space-y-3">
                            <h3 className="text-foreground text-sm font-medium">Products</h3>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Pricing
                                    </Link>
                                </li>
                                {/* <li>
                                    <Link href="#" className="hover:text-primary">
                                        Integrations
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        API
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Documentation
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Guides
                                    </Link>
                                </li> */}
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-3">
                            <h3 className="text-foreground text-sm font-medium">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href="/about" className="hover:text-primary">
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/gallery" className="hover:text-primary">
                                        Gallery
                                    </Link>
                                </li>
                                {/* <li>
                                    <Link href="#" className="hover:text-primary">
                                        Press
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Partners
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Support Center
                                    </Link>
                                </li> */}
                            </ul>
                        </div>

                        {/* Column 3 */}
                        <div className="space-y-3">
                            <h3 className="text-foreground text-sm font-medium">Legal & Contact</h3>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Cookie Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Contact Us
                                    </Link>
                                </li>
                                {/* <li>
                                    <Link href="#" className="hover:text-primary">
                                        Sales
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Support
                                    </Link>
                                </li> */}
                            </ul>
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="md:col-span-2">
                        <h3 className="text-foreground text-sm font-medium">Connect with us</h3>
                        <div className="mt-4 flex space-x-4">
                            {/* <Link href="#" className="text-muted-foreground hover:text-primary">
                                <span className="sr-only">Facebook</span>
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary">
                                <span className="sr-only">Twitter</span>
                                <Twitter className="h-5 w-5" />
                            </Link> */}
                            <a href="https://www.instagram.com/hyperionteam.id/" target="_blank" className="text-muted-foreground hover:text-primary">
                                <span className="sr-only">Instagram</span>
                                <Instagram className="size-5" />
                            </a>
                            {/* <Link href="#" className="text-muted-foreground hover:text-primary">
                                <span className="sr-only">LinkedIn</span>
                                <Linkedin className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary">
                                <span className="sr-only">GitHub</span>
                                <Github className="h-5 w-5" />
                            </Link> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-border border-t">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col items-center justify-between md:flex-row">
                        <p className="text-sm">© {new Date().getFullYear()} Hyperion Team. All rights reserved.</p>
                        <div className="mt-4 md:mt-0">
                            <ul className="flex space-x-6 text-sm">
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Privacy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-primary">
                                        Terms
                                    </Link>
                                </li>
                                {/* <li>
                                    <Link href="#" className="hover:text-primary">
                                        Sitemap
                                    </Link>
                                </li> */}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
