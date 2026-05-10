'use client';

import { Card, CardContent } from '@/components/ui/card';

import { usePage } from '@inertiajs/react';

export default function PartnershipSection() {
    const { partners } = usePage().props;

    return (
        <section className="w-full px-4">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-16 text-center text-2xl font-semibold md:text-3xl">Our Partners</h2>
                <div className="grid grid-cols-2 gap-20 sm:grid-cols-3 md:grid-cols-4">
                    {partners.map((logo, index) => (
                        <Card key={index} className="flex items-center justify-center border-0 shadow-none">
                            <CardContent className="flex items-center justify-center">
                                {logo.image ? (
                                    <img src={'/storage/' + logo.image} alt={`Partner logo ${index + 1}`} className="size-16 md:size-18" />
                                ) : (
                                    <img src={'/storage/partners/placeholder.png'} alt={`Partner logo ${index + 1}`} className="size-16 md:size-18" />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
