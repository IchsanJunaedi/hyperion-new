'use client';

import { Button } from '@/components/ui/button';
import { usePage } from '@inertiajs/react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function TeamSlider() {
    const { teams } = usePage().props;
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragLimits, setDragLimits] = useState({ left: 0, right: 0 });
    const x = useMotionValue(0);

    useEffect(() => {
        const updateLimits = () => {
            const container = trackRef.current?.parentElement;
            const track = trackRef.current;
            if (container && track) {
                const visibleWidth = container.offsetWidth;
                const fullWidth = track.scrollWidth;
                const maxDrag = fullWidth > visibleWidth ? visibleWidth - fullWidth : 0;
                setDragLimits({ left: maxDrag, right: 0 });
            }
        };

        updateLimits();
        window.addEventListener('resize', updateLimits);
        return () => window.removeEventListener('resize', updateLimits);
    }, []);

    const handleScroll = (direction: 'left' | 'right') => {
        const distance = 300;
        const currentX = x.get();
        const newX = direction === 'left' ? currentX + distance : currentX - distance;
        const clampedX = Math.max(dragLimits.left, Math.min(newX, dragLimits.right));
        animate(x, clampedX, { type: 'spring', stiffness: 300, damping: 35 });
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8 overflow-hidden px-4 py-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold md:text-3xl">Meet Our Team</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleScroll('left')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleScroll('right')}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Carousel */}
            <div className="relative overflow-hidden">
                {' '}
                {/* Changed from overflow-visible */}
                <motion.div
                    ref={trackRef}
                    className="flex gap-6 select-none"
                    style={{ x }}
                    drag="x"
                    dragConstraints={dragLimits}
                    dragElastic={0.05}
                    dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
                >
                    {teams.map((team, index) => (
                        <motion.div
                            key={index}
                            className="relative h-96 w-64 flex-shrink-0 overflow-hidden rounded-xl shadow-md"
                            style={{ cursor: 'default' }}
                        >
                            <img
                                src={team.image ? 'storage/' + team.image : '/storage/teams/placeholder.png'}
                                alt={team.name}
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                                <h3 className="mb-3 text-3xl font-semibold tracking-wide">{team.name}</h3>
                                <p className="text-md text-white/80">{team.role}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
