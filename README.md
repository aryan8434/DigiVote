# DigiVote

A modern, secure digital voting platform built for transparent elections, fast voter participation, and real-time result management.

[![Platform](https://img.shields.io/badge/Platform-Web%20%2B%20Android-0A7EA4)](https://github.com/aryan8434/DigiVote)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-0A7EA4)](Frontend)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-0A7EA4)](Backend)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2B%20Redis-0A7EA4)](Backend/config)

## Android App

- Download latest APK: [DigiVote Android APK](https://github.com/aryan8434/DigiVote/blob/main/share/DigiVote-latest-release-unsigned.apk?raw=1)
- Local file in this repo: [share/DigiVote-latest-release-unsigned.apk](share/DigiVote-latest-release-unsigned.apk)

Note: The current APK is an unsigned release build intended for direct testing/distribution.

## Key Features

- Secure voter flow with OTP/JWT-based authentication patterns
- Candidate management for election admins
- Real-time or near real-time vote updates
- Vote storage and retrieval with MongoDB models
- Caching and performance optimization with Redis
- Election configuration management from admin controls
- Time-guard middleware support for election window constraints
- Android app support via Capacitor bridge (React to native packaging)
- Cloudinary integration for media/image uploads

## Project Structure

```
Backend/   -> Express API, controllers, models, routes, middleware, configs
Frontend/  -> React + Vite + Capacitor (web and Android app)
share/     -> Built Android APK for easy distribution
```

## Tech Stack

- Frontend: React, Vite, Redux Toolkit, React Router, Tailwind CSS
- Mobile: Capacitor (Android + iOS scaffolding)
- Backend: Node.js, Express
- Database: MongoDB (primary), Redis (cache/session-style usage)
- Media: Cloudinary

## Quick Start

### 1. Clone

```bash
git clone https://github.com/aryan8434/DigiVote.git
cd DigiVote
```

### 2. Backend Setup

```bash
cd Backend
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

## Build Android APK

```bash
cd Frontend
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

Output:

```
Frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

## Why DigiVote

DigiVote is designed to reduce friction in elections while keeping the process controlled, auditable, and scalable for modern institutions.
