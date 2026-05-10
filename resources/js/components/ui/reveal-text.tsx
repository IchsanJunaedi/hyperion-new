'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface ScrollRevealTextProps {
    text: string;
    className?: string;
    darkColor?: string;
    lightColor?: string;
}

export function ScrollRevealText({ text, className = '', darkColor = '#1f2937', lightColor = '#facc15' }: ScrollRevealTextProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start 100%', 'end 60%'],
    });

    const words = text.split(' ');
    const totalWords = words.length;

    return (
        <div ref={containerRef} className={`text-center px-4 inline-block leading-snug tracking-tight ${className}`}>
            {words.map((word, index) => {
                const delayStart = index / totalWords;
                const delayEnd = delayStart + 0.2;

                const color = useTransform(scrollYProgress, [delayStart, delayEnd], [darkColor, lightColor]);

                return (
                    <motion.span key={index} style={{ color }} className="inline-block transition-colors duration-500">
                        {word}&nbsp;
                    </motion.span>
                );
            })}
        </div>
    );
}
