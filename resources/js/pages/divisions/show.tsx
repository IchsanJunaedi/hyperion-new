import DivisionPlayer from '@/components/divisions/DivisionPlayer';
import DefaultLayout from '@/layouts/DefaultLayout';
import { usePage } from '@inertiajs/react';

export default function DivisionShow() {
    const { divisionTitle } = usePage().props;

    return (
        <>
            <DefaultLayout
                title={divisionTitle as string}
                description={`Meet the ${divisionTitle} roster of Hyperion Team.`}
                keywords={`${divisionTitle}, roster, team members, hyperion team`}
            >
                <section className="py-8 md:py-16">
                    <DivisionPlayer />
                </section>
            </DefaultLayout>
        </>
    );
}
