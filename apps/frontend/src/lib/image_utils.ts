import { env } from '@/config/env';
import { EventBase } from '@/types/event';

export function getEventImageUrl(event: EventBase): string {
  if (!event.imageKey) {
    return generateImagePlaceholderEvent(event);
  }
  return `/s3/event-images/${event.imageKey}`;
}

export function getAvatarImageUrl(avatarFilename: string | undefined): string {
  if (!avatarFilename) return '';
  return `/s3/user-avatars/${avatarFilename}`;
}

function wrapLines(text: string, maxLen = 12, maxLines = 3): string[] {
  const words = text.split(/\s+/).flatMap((word) => {
    if (word.length <= maxLen) return [word];
    const chunks: string[] = [];
    for (let i = 0; i < word.length; i += maxLen) {
      chunks.push(word.slice(i, i + maxLen));
    }
    return chunks;
  });

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

export function generateImagePlaceholderEvent(event: EventBase) {
  const colors = ['oklch(0.68 0.22 45)', 'oklch(0 0 0)', 'oklch(0.4 0 0)'];
  const bgColor = colors[event.id % colors.length];
  let title = event.title.trim() || 'Great Event';
  if (title.length > 40) {
    title = title.slice(0, 37) + ' ...';
  }
  const lines = wrapLines(title, 12, 6);
  const longest = Math.max(...lines.map((l) => l.length));
  const fontSize = longest > 18 ? 26 : longest > 14 ? 32 : 48;
  const lineHeight = Math.round(fontSize * 1.05);
  const blockHeight = (lines.length - 1) * lineHeight;
  const verticalPadding = 24;
  const availableHeight = 300 - verticalPadding * 2;
  const startY = verticalPadding + (availableHeight - blockHeight) / 2;

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

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
