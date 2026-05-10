'use client';

import { usePage } from '@inertiajs/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function ParallaxAbout() {
    const { parallax_images } = usePage().props;
    const images = parallax_images ? JSON.parse(parallax_images) : null;
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

    const x1 = useTransform(scrollYProgress, [0, 1], ['0%', '-60%']);
    const x2 = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);

    return (
        <section ref={ref} className="bg-background relative">
            <div className="space-y-5 overflow-hidden">
                <motion.div style={{ x: x1 }} className="flex max-w-xs gap-6 md:max-w-2xl">
                    {images ? (
                        images.map((src, index) => (
                            <img
                                key={index}
                                src={'/storage/' + src}
                                className="aspect-[16/9] h-full w-full rounded-3xl object-cover shadow-md"
                                loading="lazy"
                                alt={`Row 1 ${index}`}
                            />
                        ))
                    ) : (
                        <img
                            src={'/storage/parallax_images/placeholder.png'}
                            className="aspect-[16/9] h-full w-full rounded-3xl object-cover shadow-md"
                            loading="lazy"
                            alt={'placeholder'}
                        />
                    )}
                </motion.div>

                <motion.div style={{ x: x2 }} className="flex max-w-xs gap-6 md:max-w-2xl">
                    {images ? (
                        images.map((src, index) => (
                            <img
                                key={index}
                                src={'/storage/' + src}
                                className="aspect-[16/9] h-full w-full rounded-3xl object-cover shadow-md"
                                loading="lazy"
                                alt={`Row 1 ${index}`}
                            />
                        ))
                    ) : (
                        <img
                            src={'/storage/parallax_images/placeholder.png'}
                            className="aspect-[16/9] h-full w-full rounded-3xl object-cover shadow-md"
                            loading="lazy"
                            alt={'placeholder'}
                        />
                    )}
                </motion.div>
            </div>
        </section>
    );
}
