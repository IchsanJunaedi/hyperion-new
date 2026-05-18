export const ACTION_LABELS: Record<string, string> = {
  // Org / Team
  org_updated: "Tim diupdate",
  org_deleted: "Tim dihapus",
  team_created: "Tim dibuat",
  // Divisions
  division_created: "Divisi dibuat",
  division_renamed: "Divisi diubah nama",
  division_archived: "Divisi diarsipkan",
  division_deleted: "Divisi dihapus",
  // Members
  member_removed: "Member dihapus",
  member_added: "Member ditambahkan",
  member_kicked: "Member dikick",
  member_left: "Member keluar",
  member_joined: "Member bergabung",
  // Auth
  user_registered: "User mendaftar",
  // Role
  role_changed: "Role diubah",
  // Announcements
  "announcement.create": "Pengumuman dibuat",
  "announcement.update": "Pengumuman diupdate",
  "announcement.delete": "Pengumuman dihapus",
  // Strategy
  "strategy.create": "Catatan strategi dibuat",
  "strategy.update": "Catatan strategi diupdate",
  "strategy.delete": "Catatan strategi dihapus",
  // Files
  "file.upload": "File diupload",
  "file.delete": "File dihapus",
  // Finances
  "finance.create": "Keuangan dicatat",
  "finance.delete": "Keuangan dihapus",
  // Content Calendar
  "content.create": "Konten dibuat",
  "content.update": "Konten diupdate",
  "content.delete": "Konten dihapus",
  "content.status_change": "Status konten diubah",
  // Scrim
  "scrim.create": "Scrim dibuat",
  "scrim.update": "Scrim diupdate",
  "scrim.delete": "Scrim dihapus",
  "scrim.cancel": "Scrim dibatalkan",
  // Matchmaking
  "scrim_request.create": "Request scrim dikirim",
  "scrim_request.accepted": "Request scrim diterima",
  "scrim_request.declined": "Request scrim ditolak",
  // Player Development
  "player_target.create": "Target pemain dibuat",
  "player_target.update": "Target pemain diupdate",
  "player_target.delete": "Target pemain dihapus",
  // Scouting
  "opponent_profile.create": "Profil lawan dibuat",
  "opponent_profile.update": "Profil lawan diupdate",
  // Tournaments
  "tournament.create": "Turnamen dibuat",
  "tournament.update": "Turnamen diupdate",
  "tournament.delete": "Turnamen dihapus",
  "tournament.status.upcoming": "Turnamen status: upcoming",
  "tournament.status.ongoing": "Turnamen status: ongoing",
  "tournament.status.completed": "Turnamen selesai",
  "tournament.status.cancelled": "Turnamen dibatalkan",
  // Polls
  "poll.create": "Polling dibuat",
  // Calendar
  "create-event": "Event kalender dibuat",
  "update-event": "Event kalender diupdate",
  "update-permissions": "Izin kalender diupdate",
  "update-visibility": "Visibilitas kalender diupdate",
  // Notifications
  "wa.retry": "WA dikirim ulang",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  organization: "Tim / Org",
  division: "Divisi",
  team_member: "Member",
  announcement: "Pengumuman",
  strategy_note: "Strategi",
  file: "File",
  finance: "Keuangan",
  content_calendar: "Konten",
  scrim: "Scrim",
  scrim_request: "Request Scrim",
  player_target: "Target Pemain",
  opponent_profile: "Profil Lawan",
  tournament: "Turnamen",
  poll: "Polling",
  calendar_event: "Event Kalender",
  notification: "Notifikasi",
};
