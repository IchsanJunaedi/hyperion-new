"use client";

import Link from "next/link";
import { Instagram } from "lucide-react";

interface PlayerRoster {
  id: string;
  display_name: string;
  avatar_url: string | null;
  username: string | null;
  role: string;
  instagram: string | null;
  orgName: string | null;
}

interface PlayerRosterCardProps {
  player: PlayerRoster;
}

const PlayerRosterCard = ({ player }: PlayerRosterCardProps) => {
  const cardClass = "group relative aspect-[3/4] overflow-hidden bg-[#030813] transition-all duration-300 clip-cyber-btn border-none block w-full h-full";
  const content = (
    <>
      {/* Portrait photo */}
      {player.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.avatar_url}
          alt={player.display_name}
          className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-out scale-100 group-hover:scale-105"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{ background: "linear-gradient(135deg, #0d1b2e 0%, #1a2a40 50%, #0a1520 100%)" }}
        />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030914] via-[#030914]/30 to-transparent opacity-90" />

      {/* Name and role */}
      <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col items-center justify-end text-center z-10">
        <h4 className="font-bebas text-2xl sm:text-3xl font-black uppercase tracking-wide text-white group-hover:text-[#F5C400] transition-colors duration-200">
          {player.display_name}
        </h4>
        <p className="font-orbitron text-[8px] font-bold uppercase tracking-widest text-white/45 mb-2">
          {player.role.toUpperCase()} {player.orgName && `• ${player.orgName.toUpperCase()}`}
        </p>

        {/* Instagram — button avoids nested <a> inside <Link> */}
        {player.instagram && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(
                `https://instagram.com/${player.instagram!.replace(/^@/, "")}`,
                "_blank",
                "noopener,noreferrer",
              );
            }}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors duration-300"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  );

  if (player.username) {
    return (
      <Link href={`/players/${player.username}`} className={cardClass}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClass}>
      {content}
    </div>
  );
};

export { PlayerRosterCard };
