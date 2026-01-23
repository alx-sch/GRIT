import { env } from '@/config/env';
import { Event } from '@/types/event';

export function getEventImageUrl(event: Event): string {
  if (!event.imageKey) {
    return generateImagePlaceholderEvent(event);
  }
  return `${env.VITE_MINIO_URL}/event-images/${event.imageKey}`;
}

function wrapLines(text: string, maxLen = 14, maxLines = 3): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxLen) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

export function generateImagePlaceholderEvent(event: Event) {
  const colors = ['oklch(0.68 0.22 45)', 'oklch(0 0 0)', 'oklch(0.4 0 0)'];
  const bgColor = colors[event.id % colors.length];
  const title = event.title.trim() || 'Great Event';
  const lines = wrapLines(title, 8, 8);
  const longest = Math.max(...lines.map((l) => l.length));
  const fontSize = longest > 18 ? 26 : longest > 14 ? 32 : 48;
  const lineHeight = Math.round(fontSize * 1.05);
  const blockHeight = (lines.length - 1) * lineHeight;
  const startY = 300 / 2 - blockHeight / 2; // vertically center block

  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text
        x="50%"
        y="${String(startY)}"
        text-anchor="middle"
        font-family="Space Grotesk, system-ui, sans-serif"
        font-size="${String(fontSize)}"
        font-weight="bold"
        fill="white"
      >
        ${lines
          .map(
            (line, idx) =>
              `<tspan x="50%" dy="${String(idx === 0 ? 0 : lineHeight)}">${line}</tspan>`
          )
          .join('')}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
