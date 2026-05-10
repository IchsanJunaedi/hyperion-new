import { Footer } from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';

interface DefaultLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    keywords?: string;
}

export default function DefaultLayout({ children, title, description, keywords }: DefaultLayoutProps) {
    const defaultDescription = 'Hyperion Team, Empowering Young Talents to Rise and Rule. Focused on Growth. Driven to Win.';
    const defaultKeywords =
        'Hyperion,Hyperion Team, Hyperion Team esports, Hyperion Team mobile legends, esports team, Hyperion Team official, Hyperion Team roster, Hyperion Team news, Hyperion Team matches';

    const finalDescription = description || defaultDescription;
    const finalKeywords = keywords || defaultKeywords;

    return (
        <>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <Head title={title}>
                    <meta name="description" content={finalDescription} />
                    <meta name="keywords" content={finalKeywords} />
                    <meta property="og:title" content={title} />
                    <meta property="og:description" content={finalDescription} />
                    <meta property="og:type" content="website" />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content={title} />
                    <meta name="twitter:description" content={finalDescription} />

                    <link rel="preconnect" href="https://fonts.bunny.net" />
                    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
                </Head>
                <div className="flex min-h-screen flex-col">
                    <Navbar />
                    <Toaster />
                    <main>{children}</main>
                    <Footer />
                </div>
            </ThemeProvider>
        </>
    );
}
