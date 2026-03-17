# Module 11 — A Complete Notification System

| Attribute | Value |
|---|---|
| **Category** | IV.1 |
| **Type** | Minor |
| **Points** | 1 |
| **Status** | Done |
| **Developers** | johdac (route-based toast system, chat unread indicators), AudreyBil (action toasts, conditional draft/publish toasts), alx-sch (email confirmation flow and toasts) |

---

## Description

A multi-channel notification system combining in-app toast notifications for all user actions (attendance, friend requests, event invites, errors, draft/publish feedback) and transactional email notifications for account events (email confirmation).

---

## Justification

Users need immediate feedback when they perform actions — especially in a social context where operations affect other people. Silent failures or successes create confusion. A notification system closes the feedback loop and guides users through multi-step flows (e.g., email confirmation after registration, or knowing whether an event was saved as draft vs. published).

---

## Implementation

### In-App Toast Notifications

**Library:** [Sonner](https://sonner.emilkowal.ski/) — a lightweight, opinionated toast library for React.

The `<Toaster>` component is mounted once in `DefaultLayout.tsx` and available globally. Toasts are triggered by calling `toast.success()`, `toast.error()`, or `toast.warning()` from anywhere in the application.

#### Action Toasts

| Action | Toast |
|---|---|
| Attend event | "You are going to [Event Name]!" |
| Unattend event | "You are no longer going to [Event Name]" |
| Publish event | "Event published successfully" |
| Save as draft | "Event saved as draft" |
| Send friend request | "Friend request sent" |
| Accept friend request | "You are now friends with [Name]" |
| Decline friend request | "Friend request declined" |
| Remove friend | "Removed [Name] from your friends" |
| Send event invite | "Invite sent to [Name]" |
| Accept event invite | "You are now attending [Event Name]" |
| Decline event invite | "Invite declined" |
| Upload image | "Image uploaded" |
| Upload image fail | "Image upload failed — event created without image" |
| Chat (unattended event) | "You must attend this event to access the chat" |
| Not logged in (Going/Invite/Chat) | Redirect to login page |
| API error | Dynamic error message from backend response |

#### Conditional Draft vs. Published Toasts

When saving or publishing an event, the toast message differs based on the action:

```ts
if (isPublished) {
  toast.success('Event published successfully');
} else {
  toast.info('Event saved as draft');
}
```

This was implemented after user testing showed that identical "Event saved" toasts for both actions caused confusion about whether the event was live.

#### Route-Based Toast System

Some toasts need to persist across page navigations (e.g., after a redirect following login). Because React Router actions may redirect before a component renders, standard toast calls in action handlers don't work reliably.

**Solution:** A `useRouteToast` custom hook mounted in `DefaultLayout` reads URL query parameters and fires the corresponding toast:

```ts
const ROUTE_TOASTS = {
  logged_in: { type: 'success', message: 'Welcome back!' },
  logged_out: { type: 'success', message: 'You have been logged out.' },
  registered: { type: 'success', message: 'Account created! Check your email.' },
};
// Any redirect can append ?logged_in=true to trigger the corresponding toast
```

This approach is decentralized — any loader or action can append a `?toastKey=true` to any redirect URL, and the global hook displays the toast.

#### Email Confirmation Toasts (Contextual)

The email confirmation link can be clicked in 4 states:
- Already confirmed + logged in → info toast: "Your email is already confirmed"
- Already confirmed + not logged in → info toast: "Your email is already confirmed. Please log in."
- Just confirmed + logged in → success toast: "Email confirmed!"
- Just confirmed + not logged in → success toast: "Email confirmed! Please log in."

### Email Notifications

**Library:** Nodemailer with SMTP transport (Mailtrap for development, real SMTP for production).

#### Email Confirmation

Triggered automatically after user registration:

```ts
async sendConfirmationEmail(email: string, token: string) {
  await this.mailerService.sendMail({
    to: email,
    subject: 'Confirm your GRIT account',
    html: `<a href="${env.APP_BASE_URL}/api/auth/confirm?token=${token}">
             Confirm your email address
           </a>`,
  });
}
```

The confirmation link hits the **backend** `/api/auth/confirm` endpoint, which validates the token and redirects to the frontend with a contextual toast query parameter.

#### Configuration

```env
MAIL_USER=your_smtp_username
MAIL_PASS=your_smtp_password
```

For production: replace with real SMTP credentials. No code changes needed.

### Unread Chat Indicators

The chat notification surface is part of the WebSocket module (Module 03) but presented as a notification:
- **Orange dot** on the "Chat" navbar icon when any conversation has unread messages.
- **"New messages ↓" banner** inside a conversation when the user has scrolled up and new messages arrive.

Both are driven by the `chatStore` (Zustand) which tracks `lastMessage` and `lastReadAt` per conversation.
