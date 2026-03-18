# Module 15 — Support for Additional Browsers

| Attribute      | Value                 |
| -------------- | --------------------- |
| **Category**   | IV.2                  |
| **Type**       | Minor                 |
| **Points**     | 1                     |
| **Status**     | Done                  |
| **Notes**      | 2 additional browsers |
| **Developers** | TBD                   |

---

## Description

Ensure full functionality of the GRIT web application in at least 2 browsers beyond the primary development browser (Chrome/Chromium). This includes layout correctness, feature parity, and no JavaScript errors across all tested browsers.

---

## Justification

Web standards are implemented with slight variations across browser engines. A social platform needs to work for all users regardless of their browser preference. Cross-browser testing catches CSS rendering differences, JavaScript API availability issues, and WebSocket compatibility edge cases.

---

## Target Browsers

| Browser           | Engine | Status                                  |
| ----------------- | ------ | --------------------------------------- |
| Chrome / Chromium | Blink  | Primary (tested throughout development) |
| Firefox           | Gecko  | Done                                    |
| Safari / WebKit   | WebKit | Done                                    |

---

## Known Considerations

### CSS Compatibility

TailwindCSS v4 with OKLCH colors requires browser support for `oklch()`:

- Chrome 111+ ✓
- Firefox 113+ ✓
- Safari 15.4+ ✓

All target browsers in current versions fully support OKLCH.

### WebSocket / Socket.IO

Socket.IO uses WebSockets with a long-polling fallback. All modern browsers support the WebSocket API natively; Socket.IO's transport negotiation handles edge cases automatically.
