'use client';

import { Link, usePage } from '@inertiajs/react';
import { motion } from 'motion/react';
import { Brand } from '../Brand';

export default function HeroSection() {
    const { heroTitle, heroDescription } = usePage().props;

    return (
        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center px-4">
            <div className="flex flex-col items-center justify-center text-center">
                <Brand className="mr-2 mb-3 size-12 md:size-32" />
                <h1 className="relative z-10 mx-auto mb-5 max-w-4xl text-xl leading-tight font-bold text-neutral-600 md:text-2xl lg:text-4xl dark:text-neutral-400">
                    {'WE ARE'.split(' ').map((word, index) => (
                        <motion.span
                            key={index}
                            initial={{ opacity: 0, filter: 'blur(4px)', y: 10 }}
                            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                                ease: 'easeInOut',
                            }}
                            className="mr-2 inline-block"
                        >
                            {word}
                        </motion.span>
                    ))}
                </h1>
            </div>

            <h1 className="text-accent relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold md:text-4xl lg:text-7xl">
                {heroTitle.split(' ').map((word, wordIndex) => (
                    <motion.span
                        key={wordIndex}
                        initial={{ opacity: 0, filter: 'blur(4px)', y: 10 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                        transition={{
                            duration: 0.3,
                            delay: wordIndex * 0.1,
                            ease: 'easeInOut',
                        }}
                        className="mr-2 inline-block"
                    >
                        {word}
                    </motion.span>
                ))}
            </h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.8 }}
                className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
            >
                {heroDescription}
            </motion.p>

            <motion.div
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.3,
                    delay: 1,
                }}
                className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
            >
                <Link href="#timeline">
                    <button className="w-60 transform rounded-lg bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                        Explore Now
                    </button>
                </Link>
            </motion.div>
        </div>
    );
}
