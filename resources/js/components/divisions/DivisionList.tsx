'use client';

import { Card } from '@/components/ui/card';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function DivisionList() {
    const { divisions } = usePage().props;

    const [statusFilter, setStatusFilter] = useState('active');

    const divisionActive = divisions.filter(
        (division) => division.status === statusFilter
    );

    const divisionInactive = divisions.filter(
        (division) => division.status === 'inactive'
    );

    return (
        <div className="mx-auto max-w-7xl px-4">

            <div className="space-y-2 mb-3">
                <h2 className="text-2xl font-semibold md:text-3xl">
                    Active Team
                </h2>
            </div>

            {divisionActive.map((division, index) => (
                <div key={index}>
                    <Link href={'/divisions/mobile-legends/' + division.slug}>
                        <Card className="mb-5 flex flex-col p-0 sm:flex-row">
                            {/* Text Content */}
                            <div className="flex w-full flex-col justify-center p-6 text-center md:w-1/2 md:text-left">
                                <h2 className="mb-4 text-2xl font-bold md:text-3xl">{division.title}</h2>
                                <div
                                    dangerouslySetInnerHTML={{ __html: division.description }}
                                    className="prose"
                                />
                            </div>

                            {/* Image Content */}
                            <div className="flex w-full items-end md:w-1/2">
                                {division.banner_image ? (
                                    <img
                                        src={'/storage/' + division.banner_image}
                                        alt={'Banner' + division.title}
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                ) : (
                                    null
                                )}
                            </div>
                        </Card>
                    </Link>
                </div>
            ))}

            <div className="space-y-2 mb-3">
                <h2 className="text-2xl font-semibold md:text-3xl">
                    Non-active Team
                </h2>
            </div>
            {divisionInactive.map((division, index) => (
                <div key={index}>
                    <Link href={'/divisions/mobile-legends/' + division.slug}>
                        <Card className="mb-5 flex flex-col p-0 sm:flex-row">
                            {/* Text Content */}
                            <div className="flex w-full flex-col justify-center p-6 text-center md:w-1/2 md:text-left">
                                <h2 className="mb-4 text-2xl font-bold md:text-3xl">{division.title}</h2>
                                <div
                                    dangerouslySetInnerHTML={{ __html: division.description }}
                                    className="prose"
                                />
                            </div>

                            {/* Image Content */}
                            <div className="flex w-full items-end md:w-1/2">
                                {division.banner_image ? (
                                    <img
                                        src={'/storage/' + division.banner_image}
                                        alt={'Banner' + division.title}
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                ) : (
                                    null
                                )}
                            </div>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
    );
}
