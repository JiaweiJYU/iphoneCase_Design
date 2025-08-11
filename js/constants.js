// 简单的演示图标（可改成你的素材 URL 列表）
const RAW_SVGS = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#f59e0b"/><circle cx="24" cy="26" r="6" fill="#fff"/><circle cx="40" cy="26" r="6" fill="#fff"/><path d="M20 44c6-6 18-6 24 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="6" y="18" width="52" height="32" rx="6" fill="#22c55e"/><rect x="12" y="24" width="40" height="20" rx="4" fill="#fff"/><circle cx="32" cy="34" r="6" fill="#22c55e"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6l7.8 15.8 17.5 2.6-12.6 12.3 3 17.4L32 45.6 16.3 54l3-17.4L6.6 24.4l17.5-2.6L32 6z" fill="#60a5fa"/></svg>`
];
export const ICONS = RAW_SVGS.map(svg => 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))));
