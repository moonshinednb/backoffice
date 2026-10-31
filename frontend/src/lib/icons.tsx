const PATHS: Record<string, string> = {
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z',
  calendar: 'M3 5h18v16H3Z M3 9h18 M8 3v4 M16 3v4', music: 'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  arrow: 'M4 12h16 M14 6l6 6-6 6', dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  invoice: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M8 13h8 M8 17h5', bank: 'M3 9h18 M4 20h16 M6 10v7 M12 10v7 M18 10v7 M2 7l10-5 10 5',
  check: 'M4 12l5 5L20 6', tasks: 'M9 5h12 M9 12h12 M9 19h12 M3 5h.01 M3 12h.01 M3 19h.01', tax: 'M4 3h16v18l-4-2-4 2-4-2-4 2Z M8 7h8 M8 11h8 M8 15h4',
  folder: 'M3 7V5a2 2 0 0 1 2-2h5l2 4h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z', plug: 'M8 3v5 M16 3v5 M6 8h12v3a6 6 0 0 1-12 0Z M12 17v5',
  play: 'M8 5v14l11-7Z', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z', plus: 'M12 5v14 M5 12h14',
  upload: 'M12 16V3 M7 8l5-5 5 5 M3 15v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5', download: 'M12 3v13 M7 11l5 5 5-5 M3 16v4h18v-4', mail: 'M3 5h18v14H3Z M3 5l9 7 9-7',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4', logout: 'M9 21H3V3h6 M9 12h12 M17 8l4 4-4 4',
  chevron: 'M9 5l7 7-7 7', close: 'M6 6l12 12 M6 18 18 6', menu: 'M3 6h18 M3 12h18 M3 18h18', spark: 'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  lock: 'M5 11h14v10H5Z M8 11V7a4 4 0 0 1 8 0v4', wallet: 'M20 8H4V4h14v4 M4 8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16V8 M15 12h5v5h-5Z',
  clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', info: 'M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', edit: 'M16 3l5 5-12 12-6 1 1-6Z M13 6l5 5',
  refresh: 'M20 7V3l-4 4 M20 7A8 8 0 0 0 5 5 M4 17v4l4-4 M4 17a8 8 0 0 0 15 2',
  warn: 'M12 3.5 2.5 20h19L12 3.5Z M12 10v4.5 M12 17.2h.01', ok: 'M4 4h16v16H4Z M8 12.4l2.7 2.7L16.2 9.4',
  plane: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z',
  bed: 'M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9', car: 'M5 17H3v-5l2-5h14l2 5v5h-2 M7 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M13 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M3 12h18',
  send: 'M22 2 11 13 M22 2l-7 20-4-9-9-4 20-7Z', trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7 M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  file: 'M14 3H6v18h12V7Z M14 3v4h4', pdf: 'M14 3H6v18h12V7Z M14 3v4h4 M9 13h6 M9 17h4', back: 'M15 5l-7 7 7 7',
  cloud: 'M17.5 19H8a6 6 0 1 1 5.3-8.8A4.5 4.5 0 1 1 17.5 19Z',
};

export function Icon({ name, className = 'icon' }: { name: string; className?: string }) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24"><path d={PATHS[name] || PATHS.invoice} /></svg>;
}
