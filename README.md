# Email Integration Platform

A recruiter-focused email management platform that enables users to connect Gmail accounts, manage mailbox settings, create signatures and templates, and send emails through Gmail OAuth integration.

## Features

* Gmail OAuth Authentication
* Mailbox Connection Management
* Email Template Management
* Signature Management
* Send Emails using Gmail API
* Mailbox Settings Configuration
* Disconnect Mailbox
* Modular Integration Architecture
* Outlook Integration Ready

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript

### Backend

* FastAPI
* PostgreSQL
* OAuth 2.0

### Integrations

* Gmail API
* Google OAuth

---

## Project Structure

```bash
app/
├── integrations/
├── integrations/request/
├── email/
├── gmail/
│   ├── templates/
│   ├── signatures/
│   └── settings/

backend/
├── main.py
├── database/
├── models/
└── services/
```

---

## Recruiter Workflow

1. Open Integrations Dashboard
2. Request Integration
3. Connect Gmail Account
4. Configure Mailbox Settings
5. Create Signatures
6. Create Email Templates
7. Compose Email
8. Send Email

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd outlook-integration
```

### Frontend Setup

```bash
npm install
npm run dev
```

Frontend will run on:

```bash
http://localhost:3000
```

### Backend Setup

Create a virtual environment:

```bash
python -m venv venv
```

Activate virtual environment:

Mac/Linux:

```bash
source venv/bin/activate
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run FastAPI server:

```bash
uvicorn backend.main:app --reload
```

Backend will run on:

```bash
http://localhost:8000
```

---

## Environment Variables

Create a `.env` file inside the backend directory:

```env
DATABASE_URL=your_database_url

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

SECRET_KEY=your_secret_key
```

---

## Future Roadmap

* Outlook OAuth Integration
* Outlook Email Sending
* IMAP Support
* Multiple Mailbox Support
* Email Analytics
* Campaign Management

---

## License

This project is for educational and development purposes.
