import { Event } from '@/types/event';

export function generateImagePlaceholderEvent(event: Event) {
  const colors = ['hsl(28.5 100% 50%)', 'hsl(0 0% 0%)', 'hsl(240 5% 64.9%)'];

  const bgColor = colors[event.id % colors.length];
  const words = event.title
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const firstTwoWords = words.slice(0, 2).join(' ');
  const MAX_CHARS = 16;

  let displayText;
  if (firstTwoWords.length > MAX_CHARS) {
    displayText = words
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  } else {
    displayText = firstTwoWords;
  }

  if (!displayText || displayText.length === 0) {
    displayText = 'Great Event';
  }

  const fontSize = displayText.length > 8 ? '38' : '50';

  const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          font-family="Space Grotesk, system-ui, sans-serif"
          font-size="${fontSize}"
          font-weight="bold"
          fill="white"
        >${displayText}</text>
      </svg>
    `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
