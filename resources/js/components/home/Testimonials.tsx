import { AnimatedTestimonials } from '@/components/ui/animated-testimonials';
import { usePage } from '@inertiajs/react';

type Testimonial = {
    description: string;
    name: string;
    position: string;
    image: string;
};

export function TestimonialsSection() {
    const autoPlay = true;
    const { testimonials } = usePage().props as unknown as {
        testimonials: any[];
    };

    const mappedTestimonials: Testimonial[] = testimonials.map((item) => ({
        description: String(item.description ?? ''),
        name: String(item.name ?? ''),
        position: String(item.position ?? ''),
        image: String(item.image ?? ''),
    }));

    return <AnimatedTestimonials autoplay={autoPlay} testimonials={mappedTestimonials} />;
}
