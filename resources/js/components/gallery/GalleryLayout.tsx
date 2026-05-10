'use client';

import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';

export default function GalleryLayout() {
    const { galleries } = usePage().props;

    return (
        <div className="mx-auto grid px-4 max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {galleries.map((gallery, index) => {
                const preview_images = gallery.preview_images ? JSON.parse(gallery.preview_images) : null;
                return (
                    <div key={index} className="relative flex flex-col rounded-xl border p-4 shadow-sm">
                        {/* Title */}
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="w-64 text-sm font-semibold">{gallery.title}</h3>
                            {gallery.logo && (
                                <img src={'/storage/' + gallery.logo} alt="Logo" className="size-14 object-contain" />
                            )}
                        </div>

                        {/* Text Content (Title + Description) */}
                        <div className="h-24">
                            <ul className="text-muted-foreground mb-4 list-inside list-disc text-xs font-medium xl:text-sm">
                                <li>Divisi Hyperion : {gallery.division}</li>
                                <li>Tanggal Tournament : {gallery.tournament_date}</li>
                                <li>Juara : {gallery.position}</li>
                                <li>Online/Offline : {gallery.status}</li>
                            </ul>
                        </div>

                        {/* Image Grid */}
                        <div className="mb-16 grid grid-cols-2 gap-3">
                            {preview_images ? (
                                preview_images.map((src, index) => (
                                    <div key={index} className="aspect-video w-full overflow-hidden rounded-md bg-gray-100">
                                        <img
                                            src={'/storage/' + src}
                                            alt={`${gallery.title} ${index + 1}`}
                                            width={400}
                                            height={225}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="aspect-video w-full overflow-hidden rounded-md bg-gray-100">
                                    <img
                                        src="/storage/galleries/placeholder.png"
                                        alt={`${gallery.title} placeholder`}
                                        width={400}
                                        height={225}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* View More Button */}
                        <div className="absolute right-4 bottom-4">
                            <Link href={'gallery/' + gallery.slug}>
                                <Button size="sm" variant="outline">
                                    View More
                                </Button>
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
