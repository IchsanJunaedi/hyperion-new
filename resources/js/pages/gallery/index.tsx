import GalleryLayout from '@/components/gallery/GalleryLayout';
import DefaultLayout from '@/layouts/DefaultLayout';

export default function GalleryIndex() {
    return (
        <>
            <DefaultLayout
                title="Gallery"
                description="Check out the latest photos and moments from Hyperion Team events and tournaments."
                keywords="esports gallery, team photos, tournament highlights, gaming community"
            >
                {/* Card Section */}
                <section className="py-16">
                    <GalleryLayout />
                </section>
            </DefaultLayout>
        </>
    );
}
