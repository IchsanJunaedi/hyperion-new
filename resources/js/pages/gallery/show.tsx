import GalleryShowComponent from '@/components/gallery/GalleryShow';
import DefaultLayout from '@/layouts/DefaultLayout';
import { usePage } from '@inertiajs/react';

export default function GalleryShow() {
    const { title } = usePage().props;
    return (
        <>
            <DefaultLayout
                title={title as string}
                description={`View the ${title} gallery from Hyperion Team.`}
                keywords={`${title}, gallery, photos, hyperion team events`}
            >
                {/* Hero Image Section */}
                <section className="mx-auto max-w-7xl py-8 md:py-16">
                    <GalleryShowComponent />
                </section>
            </DefaultLayout>
        </>
    );
}
