# Event Management System 02 (Online Cloud Version)

An extended web-based Event Management System built to support real-time attendee registration, digital QR ticketing, live entrance check-in, and attendance reporting over the internet.

**Live Demo:** [https://event-management-system-02.netlify.app](https://event-management-system-02.netlify.app)

---

## About the Project

While our initial version of the system was designed to run on a local network (LAN) using SQLite3, we built **Event Management System 02** as a full cloud-hosted web application. Hosted on Netlify and backed by Supabase, it allows administrators and entrance staff to work concurrently from different devices and locations without being tied to a single local router.

---

## Key Features

- **Role-Based Dashboards:** Separate portals and access control (`auth_guard.js`) for **Admins** and **Staff Users**.
- **Attendee Registration & Digital QR Tickets:** Registers attendees for scheduled events, generates a unique ticket ID (`TCK-XXXXXX`), and automatically downloads a print-ready PDF entry ticket with an embedded QR code.
- **Live Camera QR & NIC Check-In:** Entrance staff can scan attendee tickets using their device camera or verify them manually via Ticket Code or NIC number. The system prevents duplicate check-ins and logs who checked the attendee in along with the exact timestamp.
- **Events & Venues Management:** Admins can create, update, and remove events and venue details, as well as manage staff user accounts.
- **Filtered Attendance Reports (PDF & Excel):**
  - **Admin View:** View all registrations across all events, filter by time period (`Today`, `This Week`, `This Month`, `Last 3 Months`, `This Year`), event, or staff ID, and export reports to **PDF** or **Excel (`.xlsx`)**.
  - **User View:** View and export attendance records specifically registered by the logged-in staff member.

---

## Tech Stack

- **Frontend:** HTML5, CSS3 (Custom & Offline Tailwind Utility Classes), Vanilla JavaScript
- **Backend & Database:** Supabase (PostgreSQL & PostgREST API)
- **Hosting:** Netlify
- **Libraries Used:**
  - `jsPDF` & `jspdf-autotable` – Generating PDF tickets and attendance reports
  - `SheetJS (xlsx)` – Exporting attendance data to Excel spreadsheets
  - `qrcode-generator` – Generating QR codes for entry tickets
  - `html5-qrcode` – Live browser camera QR code scanning

---

## Database Structure (Supabase)

The application connects to a cloud PostgreSQL database on Supabase consisting of five main tables:

| Table Name | Primary Key | Description |
| :--- | :--- | :--- |
| `admins` | `admin_id` | Stores administrator credentials and contact details (`name`, `email`, `phone`, `password`). |
| `users` | `user_id` | Stores staff accounts managed by admins (`name`, `email`, `phone`, `password`). |
| `venues` | `venue_id` | Stores venue names and maximum seating capacities (`venue_name`, `capacity`). |
| `events` | `event_id` | Stores scheduled events linked to venues (`event_name`, `event_date`, `venue`, `created_at`). |
| `registrations` | `registration_id` | Tracks attendee registrations, ticket codes (`TCK-XXXXXX`), check-in status (`Pending` / `Checked-In`), and audit logs (`created_by`, `checked_by`, `checked_by_role`, `checked_in_at`). |

---

## Project Structure

```text
├── index.html             # Login portal for Admins and Users
├── admin_dashboard.html   # Full management dashboard for Administrators
├── user_dashboard.html    # Registration, check-in, and personal report portal for Staff Users
├── auth_guard.js          # Session and role-based route protection
├── script.js              # Core application logic, Supabase queries, QR & check-in handling
├── report_export.js       # PDF and Excel report generation logic
└── style.css              # Custom styling and offline utility classes
