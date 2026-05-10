import CardAbout from '@/components/about/CardAbout';
import ParralaxAbout from '@/components/about/ParallaxAbout';
import TeamSlider from '@/components/about/TeamSlider';
import { ScrollRevealText } from '@/components/ui/reveal-text';
import DefaultLayout from '@/layouts/DefaultLayout';
import { usePage } from '@inertiajs/react';

export default function About() {
    const { firstDescription } = usePage().props;
    const { secondDescription } = usePage().props;
    const { banner } = usePage().props;

    return (
        <>
            <DefaultLayout
                title="About"
                description={(firstDescription as string) || 'Learn about Hyperion Team, our mission, and our journey in esports.'}
                keywords="about hyperion team, esports organization history, mission, vision"
            >
                {/* Hero Image Section */}
                <section className="mx-auto max-w-7xl pt-8 md:pt-16">
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-3xl px-4">
                        <img
                            src={banner ? '/storage/' + banner : '/storage/banner/placeholder.png'}
                            alt="Hero about"
                            loading="lazy"
                            className="h-full w-full rounded-3xl object-cover object-center"
                        />
                    </div>
                </section>

                {/* Scroll Reveal Section 1 */}
                <section className="mx-auto max-w-4xl py-8 md:py-16">
                    <ScrollRevealText
                        text={firstDescription as string}
                        className="text-2xl font-bold md:text-4xl"
                        darkColor="#1f2937"
                        lightColor="#deb304"
                        letterDelay={0.02}
                    />
                </section>

                {/* Parallax Rows Section */}
                <section className="relative py-8 md:py-16">
                    <ParralaxAbout />
                </section>

                {/* Scroll Reveal Section 2 */}
                <section className="mx-auto max-w-4xl py-8 md:py-16">
                    <ScrollRevealText
                        text={secondDescription as string}
                        className="px-4 text-2xl font-bold md:text-4xl"
                        darkColor="#1f2937"
                        lightColor="#deb304"
                        letterDelay={0.02}
                    />
                </section>

                {/* Card Section */}
                <section className="py-8 md:py-16">
                    <CardAbout />
                </section>

                <section className="py-8 md:py-16">
                    <TeamSlider />
                </section>
            </DefaultLayout>
        </>
    );
}
