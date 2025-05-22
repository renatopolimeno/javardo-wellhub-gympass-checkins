# **App Name**: WellPass AutoCheck

## Core Features:

- QR Code Generation and Serving: Serve a static QR code that encodes the URL of the check-in endpoint.  This endpoint will start the Gympass validation flow upon being scanned.
- Gympass Check-in Webhook Reception: Receive check-in notifications from Gympass via webhook, triggered when a user initiates a check-in.
- User & Device ID Capture: Capture user and device IDs when the QR code is scanned. Use this data to cross-reference against the check-in notification.
- Gympass Ticket Validation: Query the Gympass API to validate if the user who scanned the QR code has a valid ticket for that day.
- Automated Check-in Confirmation: If the ticket is valid, automatically confirm the check-in via the Gympass API.
- Real-time Check-in Status Response: Provide immediate feedback to the user on their device (via API response), indicating whether the check-in was successful or not. Focus on providing simple affirmative or negative signals.
- Smart Check-in Restrictions: Use an AI tool to incorporate contextual information in determining if the check-in should proceed; for instance, the system can prevent too many check-ins from the same device within a short span of time.

## Style Guidelines:

- Primary color: Deep Indigo (#3F51B5) to convey trust and security.
- Background color: Very Light Indigo (#F0F1F9) for a clean and modern feel.
- Accent color: Electric Blue (#7DF9FF) to highlight successful validations and CTAs.
- Clean and easily readable font for all text elements, ensuring quick understanding of check-in status.
- Use clear and recognizable icons to represent check-in status and validation steps.
- Simple, uncluttered layout with a focus on quick and efficient user interaction.