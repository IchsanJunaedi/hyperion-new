('use client');
import { Link, usePage } from '@inertiajs/react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';

export const TimelineSection = () => {
    const { timelines } = usePage().props;
    const ref = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setHeight(rect.height);
        }
    }, [ref]);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start 10%', 'end 50%'],
    });

    const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
    const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

    return (
        <div className="mx-auto max-w-7xl bg-white px-4 font-sans dark:bg-neutral-950" ref={containerRef}>
            <div className="mx-auto w-full">
                <h2 className="mb-4 text-lg text-black md:text-4xl dark:text-white">Our Achievement</h2>
                <p className="text-sm text-neutral-700 md:text-base dark:text-neutral-300">
                    We began our journey in 2020. Here are the awards we have received since then
                </p>
            </div>

            <div ref={ref} className="relative mx-auto max-w-7xl">
                {timelines.map((item, index) => {
                    const images = JSON.parse(item.images);

                    return (
                        <div key={index}>
                            <div className="flex justify-start py-16 md:gap-10">
                                <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
                                    <div className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white md:left-3 dark:bg-black">
                                        <div className="h-4 w-4 rounded-full border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-700 dark:bg-neutral-800" />
                                    </div>
                                    <h3 className="hidden text-xl font-bold text-neutral-500 md:block md:pl-20 md:text-5xl dark:text-neutral-500">
                                        {item.title}
                                    </h3>
                                </div>

                                <div className="relative w-full pl-20 md:pl-4">
                                    <h3 className="mb-4 block text-left text-2xl font-bold text-neutral-500 md:hidden dark:text-neutral-500">
                                        {item.title}
                                    </h3>
                                    <div>
                                        <p className="mb-8 text-xs font-normal text-neutral-800 md:text-sm dark:text-neutral-200" dangerouslySetInnerHTML={{ __html: item.description }}>
                                        </p>
                                        {images ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {images.map((image, i) => (
                                                    <img
                                                        key={i}
                                                        src={'/storage/' + image}
                                                        loading="lazy"
                                                        alt={'image' + item.title}
                                                        width={500}
                                                        height={281}
                                                        className="h-32 rounded-lg object-cover shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] md:h-44 lg:h-60"
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <img
                                                src={'/storage/timelines/placeholder.png'}
                                                loading="lazy"
                                                alt="placeholder"
                                                width={500}
                                                height={281}
                                                className="h-32 rounded-lg object-cover shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] md:h-44 lg:h-60"
                                            />
                                        )}
                                        <div className="mt-3 flex justify-end">
                                            <Button>
                                                <Link href="/gallery">Load More</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div
                    style={{
                        height: height + 'px',
                    }}
                    className="absolute top-0 left-8 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8 dark:via-neutral-700"
                >
                    <motion.div
                        style={{
                            height: heightTransform,
                            opacity: opacityTransform,
                        }}
                        className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-[#deb304] via-[#deb304] to-transparent"
                    />
                </div>
            </div>
        </div>
    );
};
