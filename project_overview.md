# dChat Project Documentation

[← Back to README](./README.md)


## 1. Project Overview
**dChat** is a decentralized communication suite built on the **XMTP (Extensible Message Transport Protocol)** network. It enables secure, encrypted messaging and peer-to-peer voice/video calling directly between Ethereum wallet addresses.

### Key Features
- **Wallet-to-Wallet Messaging**: Secure, serverless communication via XMTP.
- **E2E Audio & Video Calling**: High-fidelity, peer-to-peer streams powered by WebRTC.
- **Decentralized User Profiles**: Display names and avatars synced globally over XMTP.
- **Message Revocation**: Support for "Delete for Everyone" via custom XMTP payloads.
- **Emoji Picker**: Integrated, high-performance emoji keyboard.
- **IPFS File Sharing**: Encrypted attachments powered by Pinata.
- **XMTP V3 (MLS)**: Latest protocol standards for multi-device sync and forward secrecy.
- **Cinematic UI**: Premium dark-mode aesthetic with fluid motion and high-end typography.

---

## 2. Tech Stack

### Core Frameworks
- **Next.js 16 (App Router)**: High-performance React framework.
- **TypeScript**: End-to-end type safety.
- **Tailwind CSS 4**: Modern, high-performance utility styling.
- **Framer Motion**: cinematic animations and micro-interactions.
- **Radix UI**: Accessible UI primitives.

### Web3 & Media
- **XMTP V3 (MLS)**: Leading protocol for encrypted decentralized messaging.
- **WebRTC**: Peer-to-peer media streaming layer.
- **Wagmi & Viem**: Ethereum hooks and low-level blockchain utilities.
- **RainbowKit**: Premium wallet connection UI.
- **Pinata IPFS**: Decentralized file storage.

---

## 3. File Structure & Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── chat/               # Main chat interface route
│   └── page.tsx            # Cinematic landing page
│
├── components/
│   ├── chat/               # Chat UI components
│   │   ├── VideoCallModal.tsx  # P2P Calling UI
│   │   ├── IncomingCallModal.tsx # Call notification UI
│   │   ├── ChatLayout.tsx      # Responsive grid manager
│   │   ├── ChatSidebar.tsx     # Conversation list & global sync
│   │   └── ChatWindow.tsx      # Active chat view
│   ├── ui/                 # Accessible primitives (Popover, Dialog)
│   └── layout/             # Global layout (Navbar)
│
├── lib/
│   └── xmtp/               # Protocol logic
│       ├── codecs/         # Custom types (Profile, Delete, Call)
│       ├── client.ts       # Singleton manager & revocation
│       └── messages.ts     # Content-type abstractions
│
├── hooks/
│   ├── useMessagesSync.ts  # History & stream management
│   ├── useWebRTC.ts        # P2P media orchestration
│   └── useConversationDisplay.ts # Identity resolution
│
└── types/
    └── chat.ts             # Global type definitions
```

---

## 4. Key Component Implementation Details

### A. Client Initialization (`src/lib/xmtp/client.ts`)
Manages the global XMTP `Client` instance. It follows a **Singleton pattern** and handles the "10/10 installations" protocol limit through automatic session revocation.

### B. Peer-to-Peer Calling (`src/hooks/useWebRTC.ts`)
Encapsulates the complex lifecycle of a WebRTC connection:
1. **Signaling**: Uses XMTP `CallCodec` to exchange SDP offers, answers, and ICE candidates.
2. **Media Handling**: Manages local and remote `MediaStream` objects.
3. **State Sync**: Tracks call status (calling, ringing, connected) across peers.

### C. Message Synchronization (`src/hooks/useMessagesSync.ts`)
Abstracts the logic for:
- Fetching and deduping message history.
- Handling optimistic UI updates for sent messages.
- Maintaining real-time streams and intercepting custom codecs (Deletion, Signaling).

### D. Custom XMTP Codecs (`src/lib/xmtp/codecs/`)
Extends XMTP with custom functionality:
- **`ProfileCodec`**: Decentralized identity sync.
- **`DeleteCodec`**: Remote message revocation.
- **`CallCodec`**: Secure signaling for WebRTC.

### E. IPFS & File Sharing (`src/lib/ipfs.ts`)
Uses **Pinata** for decentralized storage. Files are encrypted client-side using XMTP's `RemoteAttachmentCodec` before being pinned to IPFS, ensuring zero-knowledge storage.

---

## 5. Security & Privacy
- **MLS (Messaging Layer Security)**: Guarantees forward secrecy and secure group messaging.
- **P2P Privacy**: Calling metadata never touches a central server; signaling is encrypted via XMTP.
- **Self-Sovereign Identity**: Users own their keys, their messages, and their social graph.
