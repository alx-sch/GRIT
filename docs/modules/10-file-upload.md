# Module 10 — File Upload and Management System

| Attribute      | Value                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Category**   | IV.1                                                                                                                           |
| **Type**       | Minor                                                                                                                          |
| **Points**     | 1                                                                                                                              |
| **Status**     | Done                                                                                                                           |
| **Developers** | AudreyBil (frontend FileUpload component, event image/PDF endpoints), alx-sch (MinIO storage infrastructure, avatar endpoints) |

---

## Description

A complete file upload system supporting multiple file types (images, PDFs), with client-side and server-side validation, secure storage in MinIO (S3-compatible), file preview functionality, progress indicators, and the ability to delete uploaded files.

---

## Justification

Events are much more compelling with visual content. Cover images help users quickly identify events at a glance. PDF attachments (flyers, schedules, maps) provide rich context. A well-designed upload system with validation and previews ensures a smooth user experience while keeping storage secure and organized.

---

## Implementation

### Storage Backend: MinIO

**MinIO** is an S3-compatible object storage server running as a Docker container. It provides:

- S3-compatible API — the same code works with AWS S3, DigitalOcean Spaces, or any S3-compatible service in production.
- Separate **buckets** for different file types:
  - `avatars` — user profile pictures
  - `event-images` — event cover photos
  - `event-files` — event attachments (PDFs, additional images)

Files are stored with unique keys generated at upload time:

```ts
const key = `${Date.now()}-${nanoid(8)}.${extension}`;
await this.minioClient.putObject(bucket, key, buffer, { 'Content-Type': mimeType });
```

### Server-Side Validation

All file uploads go through **Multer** (NestJS file interceptor) with strict server-side validation:

| Type              | Max size | Allowed MIME types           |
| ----------------- | -------- | ---------------------------- |
| Avatar            | 5 MB     | `image/*`                    |
| Event cover image | 5 MB     | `image/*`                    |
| Event attachment  | 10 MB    | `image/*`, `application/pdf` |

A custom file type validator checks the MIME type. A fallback checks `Content-Type` from the request for edge cases where the file type validator fails (e.g., some PDF uploads from certain browsers):

```ts
if (!allowedTypes.includes(file.mimetype)) {
  throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
}
```

### Backend Endpoints

| Endpoint                           | Purpose                                |
| ---------------------------------- | -------------------------------------- |
| `PATCH /users/me/avatar`           | Upload user avatar                     |
| `PATCH /events/:id/upload-image`   | Upload event cover image               |
| `DELETE /events/:id/image`         | Delete event cover image               |
| `POST /events/:id/files`           | Upload event attachment (image or PDF) |
| `DELETE /events/:id/files/:fileId` | Delete event attachment                |

All mutating endpoints verify ownership (or admin role) before processing.

### Database: EventFile Model

```prisma
model EventFile {
  id        Int      @id @default(autoincrement())
  fileKey   String
  bucket    String
  fileName  String
  mimeType  String
  eventId   Int
  event     Event    @relation(..., onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

When an event is deleted, all associated `EventFile` records are cascade-deleted and the physical files removed from MinIO.

### Frontend: FileUpload Component

A reusable `FileUpload` component (`apps/frontend/src/components/ui/file-upload.tsx`):

- **Drag-and-drop** and click-to-browse via `react-dropzone`.
- **Client-side validation**: MIME type and file size checked before the upload request is sent.
- **Image preview**: Square aspect ratio preview matching event card display.
- **Progress bar**: Animated progress using an `onProgress` callback and axios upload events.
- **Error states**: Validation errors displayed inline.
- **Configurable** via `accept` and `maxSize` props:

```tsx
{
  /* Image upload (default) */
}
<FileUpload onChange={setFile} />;

{
  /* PDF upload */
}
<FileUpload
  onChange={setFile}
  accept={{ 'application/pdf': ['.pdf'] }}
  maxSize={10 * 1024 * 1024}
/>;
```

### Event Page: File Gallery

Uploaded files displayed on the event detail page:

- **Images**: thumbnails in a grid; clicking opens a **lightbox viewer**.
- **PDFs**: download links with file name.

### File Deletion

- In **edit mode**, existing files are listed with a delete button per file.
- Deletions are queued locally and applied on form submission (`DELETE` per removed file).
- When an event is deleted via the confirmation dialog, all images and files are deleted from MinIO before the database record is removed.
