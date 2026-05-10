import HeroSection from '@/components/home/HeroSection';
import { JoinUsSection } from '@/components/home/JoinUsSection';
import PartnershipSection from '@/components/home/PartnershipSection';
import { TestimonialsSection } from '@/components/home/Testimonials';
import { TimelineSection } from '@/components/home/TimelineSection';
import DefaultLayout from '@/layouts/DefaultLayout';

export default function Home() {
    return (
        <DefaultLayout
            title="Home"
            description="Hyperion Team - The premier esports organization empowering young talents."
            keywords="esports, mobile legends, competitive gaming, hyperion team home"
        >
            <section className="py-8 md:py-16">
                <HeroSection />
            </section>
            <section id="timeline" className="py-8 md:py-16">
                <TimelineSection />
            </section>
            <section className="py-8 md:py-16">
                <TestimonialsSection />
            </section>
            <section className="py-8 md:py-16">
                <PartnershipSection />
            </section>
            <section className="py-8 md:py-16">
                <JoinUsSection />
            </section>
        </DefaultLayout>
    );
}
