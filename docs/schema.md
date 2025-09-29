# Firestore Database Schema for Pooyeshyar App

## Overview

This schema supports companies signing up, creating tickets, and admins managing them with chat functionality.

## Collections

### Users

- **Document ID**: uid (from Firebase Auth)
- **Fields**:
  - email: string
  - role: string ('company' or 'admin')
  - name: string (only for companies)
  - organization: string (only for companies)

### Tickets

- **Document ID**: auto-generated
- **Fields**:
  - companyId: string (reference to Users/uid)
  - name: string
  - organization: string
  - problem: string
  - status: string ('open' or 'solved')
  - createdAt: timestamp

#### Subcollections

##### Messages

- **Document ID**: auto-generated
- **Fields**:
  - senderId: string (reference to Users/uid)
  - text: string
  - timestamp: timestamp