import {env} from '@/config/env';
import {Event} from '@/types/event';

export function getEventImageUrl(event: Event): string {
  if (!event.imageKey) {
    return generateImagePlaceholderEvent(event);
  }
  return `${env.VITE_MINIO_URL}/event-images/${event.imageKey}`;
}

export function generateImagePlaceholderEvent(event: Event) {
  const colors = ['oklch(0.68 0.22 45)', 'oklch(0 0 0)', 'oklch(0.4 0 0)'];

  const bgColor = colors[event.id % colors.length];
  const words = event.title.trim().split(/\s+/).filter((w) => w.length > 0);

  let displayText = words.map((w) => w[0].toUpperCase()).join('');

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
