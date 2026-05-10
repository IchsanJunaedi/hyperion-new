'use client';

import { BackgroundBeams } from '../ui/background-beams';
import { JoinUsModal } from './JoinUsModal';

export function JoinUsSection() {
    return (
        <div className="relative mx-auto flex h-[40rem] w-full flex-col items-center justify-center rounded-md bg-neutral-950 antialiased">
            <div className="mx-auto max-w-2xl p-4">
                <h1 className="relative z-10 bg-gradient-to-b from-neutral-200 to-neutral-600 bg-clip-text text-center font-sans text-4xl font-bold text-transparent md:text-7xl">
                    Join Us
                </h1>
                <p className="relative z-10 mx-auto my-2 max-w-lg text-center text-lg text-neutral-500 md:text-2xl">
                    Unleash Young Potential Power. Focus of Develop Young Player
                </p>
                <p className="relative z-10 mx-auto my-2 max-w-lg text-center text-lg text-neutral-500 md:text-2xl">#HypeWin</p>
                <JoinUsModal />
            </div>
            <BackgroundBeams />
        </div>
    );
}
