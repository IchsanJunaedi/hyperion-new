'use client';
import { TracingBeam } from '@/components/ui/tracing-beam';
import { usePage } from '@inertiajs/react';

export default function GalleryShow() {
    const { gallery } = usePage().props;

    return (
        <TracingBeam className="px-4">
            <div className="relative mx-auto max-w-2xl antialiased">
                {gallery.map((item, index) => {
                    const image = item.images ? JSON.parse(item.images) : null;
                    return (
                        <div key={`content-${index}`} className="mb-10">
                            <p className="mb-4 text-xl">{item.title}</p>

                            <div className="prose prose-sm dark:prose-invert text-sm md:text-lg">
                                {image ? (
                                    <img
                                        src={'/storage/' + image[0]}
                                        alt={'Image ' + item.title}
                                        height="1000"
                                        width="1000"
                                        className="mb-10 rounded-lg object-cover"
                                    />
                                ) : (
                                    <img
                                        src={'/storage/galleries/placeholder.png'}
                                        alt="Placeholder"
                                        height="1000"
                                        width="1000"
                                        className="mb-10 rounded-lg object-cover"
                                    />
                                )}
                                <div className="my-3">
                                    <p className="font-medium">Divisi Hyperion : {item.division}</p>
                                    <p className="font-medium">Tanggal Tournament : {item.tournament_date}</p>
                                    <p className="font-medium">Juara : {item.position}</p>
                                    <p className="font-medium">Online/Offline : {item.status}</p>
                                </div>
                                <p className="text-justify indent-8 leading-6" dangerouslySetInnerHTML={{ __html: item.description }}></p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </TracingBeam>
    );
}
