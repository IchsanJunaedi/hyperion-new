/**
 * WhatsApp message templates for scrim and tournament notifications.
 */

interface ScrimWaData {
  orgName: string;
  opponentName: string;
  scheduledAt: string; // ISO string
  format: string;
  serverRegion?: string | null;
  roomInfo?: string | null;
  notes?: string | null;
  scrimUrl: string;
}

interface TournamentWaData {
  orgName: string;
  tournamentName: string;
  organizer?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  prizePool?: string | null;
  registrationFee?: string | null;
  registrationUrl?: string | null;
  tournamentUrl: string;
}

/**
 * Format a date string to WIB locale string.
 */
function formatWIB(isoString: string): string {
  return new Date(isoString).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function formatDateOnly(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

/**
 * Build WA message for a new scrim.
 */
export function buildScrimWaMessage(data: ScrimWaData): string {
  const lines = [
    `[${data.orgName}] 🎮 *Scrim Baru!*`,
    "",
    `*Lawan:* ${data.opponentName}`,
    `*Waktu:* ${formatWIB(data.scheduledAt)}`,
    `*Format:* ${data.format.toUpperCase()}`,
  ];

  if (data.serverRegion) {
    lines.push(`*Region:* ${data.serverRegion}`);
  }
  if (data.roomInfo) {
    lines.push(`*Room:* ${data.roomInfo}`);
  }
  if (data.notes) {
    lines.push(`*Catatan:* ${data.notes}`);
  }

  lines.push("");
  lines.push("Konfirmasi kehadiranmu dengan *balas pesan ini*:");
  lines.push("*1* - Hadir  |  *2* - Tidak Hadir  |  *3* - Mungkin");
  lines.push("");
  lines.push("Atau buka aplikasi:");
  lines.push(data.scrimUrl);

  return lines.join("\n");
}

interface TournamentRegisteredWaData {
  orgName: string;
  tournamentName: string;
  organizer?: string | null;
  startDate: string;
  prizePool?: string | null;
  registrationUrl?: string | null;
  tournamentUrl: string;
}

/**
 * Build WA message when registration is confirmed for a tournament.
 */
export function buildTournamentRegisteredWaMessage(data: TournamentRegisteredWaData): string {
  const lines = [
    `[${data.orgName}] ✅ *Pendaftaran Dikonfirmasi!*`,
    "",
    `*Turnamen:* ${data.tournamentName}`,
  ];

  if (data.organizer) {
    lines.push(`*Organizer:* ${data.organizer}`);
  }

  lines.push(`*Mulai:* ${formatDateOnly(data.startDate)}`);

  if (data.prizePool) {
    lines.push(`*Prize Pool:* ${data.prizePool}`);
  }

  if (data.registrationUrl) {
    lines.push(`Link registrasi: ${data.registrationUrl}`);
  }

  lines.push("");
  lines.push("Tim kita sudah resmi terdaftar. Persiapkan dirimu!");
  lines.push("");
  lines.push(`Info turnamen: ${data.tournamentUrl}`);

  return lines.join("\n");
}

/**
 * Build WA message for a new tournament.
 */
export function buildTournamentWaMessage(data: TournamentWaData): string {
  const lines = [
    `[${data.orgName}] 🏆 *Turnamen Baru!*`,
    "",
    `*Nama:* ${data.tournamentName}`,
  ];

  if (data.organizer) {
    lines.push(`*Organizer:* ${data.organizer}`);
  }

  lines.push(`*Mulai:* ${formatDateOnly(data.startDate)}`);

  if (data.endDate) {
    lines.push(`*Selesai:* ${formatDateOnly(data.endDate)}`);
  }
  if (data.prizePool) {
    lines.push(`*Prize Pool:* ${data.prizePool}`);
  }
  if (data.registrationFee) {
    lines.push(`*Biaya Daftar:* ${data.registrationFee}`);
  }

  lines.push("");

  if (data.registrationUrl) {
    lines.push(`Link registrasi: ${data.registrationUrl}`);
  }

  lines.push(`Info lengkap: ${data.tournamentUrl}`);

  return lines.join("\n");
}
