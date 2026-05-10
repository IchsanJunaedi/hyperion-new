'use client';

import { usePage } from '@inertiajs/react';

export default function DivisionPlayer() {
    const { players, divisionTitle, divisionDescription, divisionAchievements, divisionStatus } = usePage().props;


    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4">
            {/* Header */}
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold md:text-3xl">
                    {divisionTitle}
                </h2>
                <h2 className="text-2xl font-semibold md:text-3xl"
                    dangerouslySetInnerHTML={{ __html: divisionDescription }}>
                </h2>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold md:text-2xl">
                    Achievements
                </h2>
                <div
                    dangerouslySetInnerHTML={{ __html: divisionAchievements }}
                    className="prose"
                />
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {players.map((player, index) => (
                    <div
                        key={index}
                        className="relative flex-shrink-0 overflow-hidden rounded-xl shadow-md"
                    >
                        <img
                            src={player.image ? '/storage/' + player.image : '/storage/players/placeholder.png'}
                            alt={'Image ' + player.name}
                            className={divisionStatus == 'inactive' ? 'h-full w-full object-cover opacity-50' : 'h-full w-full object-cover'}
                        />
                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                            <h3 className="text-3xl lg:text-2xl font-semibold tracking-wide">{player.name}</h3>
                            <h3 className="mb-3 text-2xl lg:text-xl tracking-wide">{player.nickname}</h3>
                            <p className="text-xl lg:text-lg">{player.role}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
