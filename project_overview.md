# dChat Project Documentation

[← Back to README](./README.md)


## 1. Project Overview
**dChat** is a decentralized, secure messaging application built on the **XMTP (Extensible Message Transport Protocol)** network. It allows users to send encrypted messages directly between Ethereum wallet addresses without relying on centralized servers for data storage.

### Key Features
- **Wallet-to-Wallet Messaging**: Log in with your Ethereum wallet (MetaMask, Rainbow, etc.).
- **Decentralized User Profiles**: Set a Display Name and Avatar which are synced automatically to peers over XMTP without a central database.
- **Message Deletion**: Support for "Delete for Me" and "Delete for Everyone" via custom XMTP deletion payloads.
- **Emoji Picker**: Fully integrated, fast emoji keyboard to enrich messaging.
- **End-to-End Encryption**: Messages are encrypted and can only be decrypted by the recipient.
- **High-End visual Narrative**: Premium dark aesthetic with a custom noise-overlay, cinematic typography, and blockchain-themed components.
- **Interactive Encryption Visualization**: A custom terminal-style card displaying real-time encryption pipeline steps (handshakes, key rotations, hashing).
- **GPU-Optimized Performance**: Adaptive rendering that disables heavy effects on mobile while maintaining cinematic quality on desktop.
- **Smart Adaptive Navbar**: Intelligently hides on scroll-down to maximize real estate and morphs into a compact pill-mode on scroll-up.
- **XMTP V3 Integration**: Uses the latest MLS-based protocols for improved privacy and reliable multi-device sync.
- **IPFS File Sharing**: Securely share images and files using Pinata IPFS and XMTP Remote Attachments.

---

## 2. Tech Stack

### Core Frameworks
- **Next.js 16 (App Router)**: High-performance React framework with server-side stability.
- **TypeScript**: Full type-safety across protocol and UI layers.
- **Tailwind CSS 4**: Modern utility-first styling with high-performance `@layer` architecture.
- **Framer Motion**: Powering the high-end micro-interactions and scroll-triggered revealing sequences.
- **Shadcn UI & Radix**: Accessible primitive components (Dialogs, Popovers, etc.).
- **Emoji Picker React**: Robust, high-performance emoji keyboard integration.

### Web3 & Messaging
- **@xmtp/browser-sdk (V3)**: The leading protocol for end-to-end encrypted decentralized messaging.
- **Wagmi & Viem**: Robust hooks for wallet connectivity and low-level blockchain interactions.
- **RainbowKit**: Premium UI for wallet selection and session management.
- **Pinata IPFS**: Decentralized file storage provider.
- **Custom XMTP Codecs**: `ProfileCodec` and `DeleteCodec` for custom app-layer functionality.

---

## 3. File Structure & Architecture

The project follows a standard Next.js App Router structure, with logic separated into `components`, `lib`, and `hooks`.

```
src/
├── app/                    # Next.js App Router pages
│   ├── chat/               # Main chat interface route
│   │   └── page.tsx        # Chat page entry point, handles Client Init & Errors
│   ├── layout.tsx          # Global layout (Providers, Fonts)
│   └── page.tsx            # Landing page (redirects to /chat)
│
├── components/
│   ├── home/               # Landing page specific visualizations
│   │   ├── encryption-card.tsx # Animated terminal encryption pipeline
│   │   ├── code-preview.tsx    # High-contrast SDK integration preview
│   │   └── project-overview-card.tsx # Technical manifest card
│   ├── chat/               # Chat-specific UI components
│   │   ├── ChatLayout.tsx          # Main grid layout (Sidebar + Window)
│   │   ├── ChatSidebar.tsx         # List of active conversations
│   │   ├── ChatWindow.tsx          # Message view for a specific chat
│   │   ├── ConversationListItem.tsx# Reusable peer chat list item with Avatar
│   │   ├── MessageBubble.tsx       # Styled message row with attachment support
│   │   ├── MessageInput.tsx        # Command-center for messaging, attachments & emojis
│   │   └── ProfileModal.tsx        # IPFS-backed Avatar/Name settings menu
│   ├── ui/                 # Shadcn UI primitives
│   │   ├── dialog.tsx      # Used for Avatar preview
│   │   └── popover.tsx     # Used for Emoji Picker
│   ├── layout/             # Global layout elements
│   │   └── navbar.tsx      # Adaptive hiding/compacting navigation
│   └── auth/               # Authentication components
│       └── login-button.tsx        # Protocol-aware connect button
│
├── lib/
│   └── xmtp/               # XMTP Logic Isolation
│       ├── codecs/         # Custom ContentType decoders
│       │   ├── ProfileCodec.ts # Serializes User Avatars/Names
│       │   └── DeleteCodec.ts  # Handles "Delete for Everyone" tombstones
│       ├── client.ts       # Client creation, singleton, revocation logic
│       ├── conversations.ts # Fetching & listing conversations
│       └── messages.ts     # Sending, fetching, and streaming messages
│   └── ipfs.ts             # IPFS Upload Service (Pinata)
│
├── hooks/
│   └── useConversationDisplay.ts # Hook to resolve peer names/avatars via local profiles
│
└── types/
    └── chat.ts             # TypeScript definitions for Chat interfaces
```

---

## 4. Key Component Implementation Details

### A. Client Initialization (`src/lib/xmtp/client.ts`)
This file manages the XMTP `Client` instance. It follows a **Singleton pattern** to prevent multiple clients from being active simultaneously.

- **`createXmtpClient`**:
    1.  Checks if browser supports **OPFS** (Required for V3).
    2.  Uses the connected wallet (`viem`) to sign a message.
    3.  Creates the `Client` keys and connects to the XMTP network (dev/production).
    4.  **Codecs**: Registers `AttachmentCodec` and `RemoteAttachmentCodec` for file support.
- **`revokeOtherInstallations`**:
    - Handles the "10/10 installations" error.
    - Fetches the user's `InboxState`.
    - Revokes old installation keys to free up space for the new device.

### B. Chat Window (`src/components/chat/ChatWindow.tsx`)
The heart of the messaging experience.
- **State**: Manages `messages`, `isLoading`, and `isSending`.
- **Auto-Scroll**: Uses a `useEffect` hook listening to `messages` array changes to scroll a `div ref` into view.
- **Streaming**: Subscribes to new messages in real-time using `streamMessages`.

### C. Custom XMTP Codecs (`src/lib/xmtp/codecs/`)
To extend beyond standard text and image messaging, dChat leverages XMTP Custom Content Types:
- **`ProfileCodec`**: Encodes a `displayName` and `avatarUrl` (IPFS link). When a user updates their profile, a silent message is broadcasted to all active conversations. The global `streamAllMessages` listener intercepts these, saving the profile to `localStorage` and discarding the message from the visible UI, ensuring decentralized profile synchronization.
- **`DeleteCodec`**: Encodes a `messageId`. When a user chooses "Delete for Everyone", a tombstone payload is broadcasted. Receiving clients intercept this schema and add the original message to a local hidden blocklist.

### D. Sidebar (`src/components/chat/ChatSidebar.tsx`)
Displays the list of conversations.
- **Streaming**: Listens for new conversations (e.g., when someone messaging you for the first time).
- **Global Profile Sync**: Actively listens to `streamAllMessages` in the background strictly to intercept incoming `ProfileCodec` updates globally without needing the specific chat open.
- **Navigation**: Selecting a chat updates parent state in `ChatLayout`.
- **Branding**: Includes the `dChat.svg` logo and Inbox ID hash in the footer, along with the `ProfileModal` trigger.

### E. IPFS & File Sharing (`src/lib/ipfs.ts`)
- **Storage**: Uses **Pinata IPFS** for decentralized storage (Avatars and File Attachments).
- **Encryption**: Files are encrypted using XMTP's `RemoteAttachmentCodec` before upload.
- **Flow**:
    1.  User selects file -> `MessageInput` (paperclip).
    2.  File is encrypted -> Encrypted blob uploaded to IPFS.
    3.  Message sent with `RemoteAttachment` content type (contains IPFS URL + Decryption Keys).
    4.  Recipient downloads, decrypts, and renders the file in `MessageBubble`.

---

## 5. Data Flow

1.  **Connect Wallet**: User clicks "Connect Wallet" (RainbowKit).
2.  **Sign Keys**: User signs a message to generate/unlock Identity Keys.
3.  **Client Ready**: `ChatPage` receives the initialized `Client`.
4.  **Fetch Conversations**: `ChatSidebar` asks `lib/xmtp/conversations` for the list.
5.  **Select Chat**: User clicks a chat → `ChatWindow` mounts.
6.  **Stream Messages**: `ChatWindow` opens a stream for that specific conversation.

---

---

## 6. Visual Identity & Performance

### A. Aesthetic Design System
- **Strict Palette**: Pure black (`#000000`) to deep zinc (`#030303`) with emerald accents.
- **Cinematic Texture**: Subtle noise-overlay SVG filter applied globally to eliminate flat blacks.
- **Motion Language**: 400ms-600ms easing curves for "snappy yet fluid" interactions.

### B. Performance Strategy
- **GPU Promotion**: Critical animations use `will-change: transform` to stay on the compositing layer.
- **Adaptive Rendering**: `backdrop-filter: blur()` is automatically disabled on mobile (768px <) to prevent GPU throttling.
- **Dynamic Imports**: Heavy cards (`ProjectOverviewCard`, `CodePreview`) are lazy-loaded with shimmering placeholders.

---

## 7. Protocol Logic & Security

### A. Trustless Encryption
Messages are never stored in dChat databases. Everything is encrypted via client-side keys and stored on the decentralized XMTP network. The `EncryptionCard` visualizes this pipeline through:
1.  **Handshake**: Identity key retrieval.
2.  **Key Rotation**: Forward secrecy implementation.
3.  **Sealing**: Final payload encryption before network broadcast.

### B. Session Isolation
Advanced `lib/xmtp/client.ts` logic prevents race conditions during initialization and handles multi-device synchronization by managing the 10-installation limit through automatic or manual revocation.
