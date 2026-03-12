# dChat - Comprehensive Project Explanation and System Design

## 1. System Design and Architecture
dChat is a decentralized messaging application built using Next.js 15 (App Router), React, and the XMTP (Extensible Message Transport Protocol) network. 

### Core Components
- **Frontend Framework**: Next.js App Router providing server-side stability and fast static/dynamic page generation.
- **Styling & UI**: Tailwind CSS 4, Framer Motion for animations, and Shadcn UI primitives for accessible components.
- **Web3 & Authentication**: Viem and Wagmi hooks paired with RainbowKit for wallet connectivity. The Ethereum wallet address serves as the user's sovereign identity. No centralized authentication server exists.
- **Messaging Protocol**: `@xmtp/browser-sdk` (V3). It uses decentralized nodes (libp2p) to transport encrypted messages securely. 
- **Decentralized Storage**: Pinata (IPFS) is used for file sharing (images, pdfs, etc.) with encryption via XMTP's RemoteAttachmentCodec.

### Data Flow & State Management
1. **Initialization**: The user connects their wallet and cryptographically signs a message to produce the XMTP Identity Keys. A singleton `Client` instance is instantiated to avoid multi-instance conflicts.
2. **Conversations**: The Sidebar polls and streams from the XMTP network. If another user sends a DM, the stream listener captures the `ConsentState.Unknown` message and lists it.
3. **Messages**: Upon clicking a conversation, the Chat Window fetches history and establishes an active real-time stream using `streamMessages`.
4. **Custom Extensibility**: The app uses custom Codecs to handle functionality beyond text:
    - **`ProfileCodec`**: Broadcasts displayName/avatar changes as silent messages interpreted globally.
    - **`DeleteCodec`**: Broadcasts a tombstone that forces clients to add the original message to a local hidden blocklist for the "Delete for Everyone" feature.

---

## 2. File-by-File & Method-by-Method Breakdown

### `/src/app/` (Next.js Application Routing)

#### `layout.tsx`
- **Purpose**: The global HTML/Body wrapper and Next.js layout provider. Includes the `Providers` component and `Toaster` for notifications.
- **Methods/Components**:
    - `RootLayout({ children })`: Applies global fonts (Geist), Tailwind anti-aliasing, and wraps the application UI in the decentralized context providers.

#### `page.tsx`
- **Purpose**: The animated landing page, showcasing the value proposition of dChat.
- **Methods/Components**:
    - `Home()`: Renders the cinematic hero section, feature cards, and calls to action. Conditionally links to `/chat` if the wallet is already connected.

#### `chat/page.tsx`
- **Purpose**: The main Chat Interface entry point. Handles XMTP Client initialization, error boundary presentation, and multi-device revocation.
- **Methods/Rules**:
    - `ChatPage()`: 
        - `useEffect(...)`: Checks if the wallet is connected and initializes the `createXmtpClient` singleton. Handles throwing errors for pending signatures or 10/10 device limits.
        - `handleRevoke()`: Calls `revokeOtherInstallations` to clear old XMTP sessions so the user can connect.

---

### `/src/components/chat/` (Chat Interface Features)

#### `ChatLayout.tsx`
- **Purpose**: The responsive structure that combines the Sidebar and the Chat Window. Handles mobile views by toggling visibility based on whether a conversation is active.
- **Methods**:
    - `handleSelectConversation(conversation)`: Sets the currently active chat context.
    - `handleBackToSidebar()`: Clears the selected conversation to show the Sidebar on mobile.
    - `handleConversationDeleted()`: Triggers a Sidebar list refresh.

#### `ChatSidebar.tsx`
- **Purpose**: Displays the list of all active conversations and handles global stream listeners for receiving new inbound messages and profile updates.
- **Methods**:
    - `getLocalProfile()`: Fetches the user's localized displayName/avatar from `localStorage`.
    - `handleSaveProfile(newName, newAvatar)`: Updates the local profile and broadcasts a silent `ProfileCodec` message to all `conversations` network-wide.
    - `getDeletedBlocklist()`: Returns the local list of permanently deleted conversations.
    - `listAndSetConversations()`: Queries local DB state for conversations (deduping blocklisted ones).
    - `refreshConversations()`: Hard-syncs the XMTP network, then lists conversations. Used for fallback polling.
    - `useEffect(...)`: 
        - Instantiates `doInitialLoad()`
        - Starts `doConvStream()` to instantly realize new DMs.
        - Starts `doMsgStream()` to intercept global `profile` content-type updates secretly without needing to open specific chats.

#### `ChatWindow.tsx`
- **Purpose**: Renders the message history, handles real-time streams, attachments, and deletion toggles for a specific peer.
- **Methods**:
    - `handleDeleteMessage(messageId, isRemote)`: Hides the message locally. If `isRemote` is true, sends a `DeleteCodec` payload to the network.
    - `handleDelete()`: Deletes the entire conversation permanently by adding it to a local blocklist and denying the XMTP consent state.
    - `loadMessages()`: Checks the network for the specific conversation's history. Parses out `delete` and `profile` messages into local state blocklists instead of rendering them. 
    - `handleSendMessage(content)`: Uses `sendMessage` from the `/lib` folder.

#### `MessageBubble.tsx`
- **Purpose**: Responsible for rendering a single text or attachment payload, styling it depending on whether it was sent by the user (`isMe`) or the peer.
- **Methods**:
    - `loadRemoteAttachment()` (Inside `useEffect`): If the payload is encrypted IPFS data (`RemoteAttachmentCodec`), it pulls it, decrypts it locally, and creates a local `Blob` object URL for rendering.
    - `handleDownload(e)`: Takes the decrypted byte array of the attachment and forces a browser download.

#### `MessageInput.tsx`
- **Purpose**: The unified footer bar for typing messages, attaching files, and picking emojis.
- **Methods**:
    - `onEmojiClick(emojiData)`: Appends an emoji to the `content` string.
    - `handleSend()`: Validates input, passes `File` or `string` up to the `onSendMessage` prop, and clears the input box.
    - `handleFileSelect(e)`: Captures the `File` object from the hidden HTML file picker.

#### `ConversationListItem.tsx`
- **Purpose**: Reusable component rendering a peer's avatar, name, and last activity in the sidebar list.
- **Methods**:
    - Passes conversation data into the `useConversationDisplay` hook and conditionally opens an avatar preview modal.

#### `NewChatModal.tsx`
- **Purpose**: Allows users to input a known Ethereum address (0x...) or ENS name to instantiate a brand new XMTP DM context.
- **Methods**:
    - `handleSubmit(e)`: Validates the address using Viem, checks if the peer is on the network via `checkCanMessage`, creates the conversation using `createConversation`, and removes any previous "deleted" blocklist entry for that peer.

---

### `/src/lib/xmtp/` (Core Protocol Logic)

#### `client.ts`
- **Purpose**: The singleton manager for the `Client` object and session keys.
- **Methods**:
    - `checkBrowserCompatibility()`: Validates that the device supports the OPFS File System required by XMTP V3.
    - `createXmtpClient(options)`: Instantiates `Client.create()` using the connected `walletClient` signer. Registers the `AttachmentCodec`, `RemoteAttachmentCodec`, `DeleteCodec`, and `ProfileCodec`.
    - `revokeOtherInstallations(walletClient, inboxId, env)`: Resolves the 10-installation limit by fetching all installation IDs for the Inbox and dispatching a static `revokeInstallations()` network command to safely log the user back in.

#### `conversations.ts`
- **Purpose**: Abstraction layer for creating and managing chat structures.
- **Methods**:
    - `listConversations(client)`: Lists contexts that have `Allowed` or `Unknown` consent states.
    - `deleteConversation(conversation)`: Submits a network update changing the peer context to `ConsentState.Denied`.
    - `createConversation(client, peerAddress)`: Uses `createDmWithIdentifier()` to establish the cryptographic relationship.
    - `checkCanMessage(client, peerAddress)`: Checks if the destination address has initialized their XMTP keys.

#### `messages.ts`
- **Purpose**: Handles fetching, sending, and streaming operations specifically for payloads within an established conversation context.
- **Methods**:
    - `fetchMessages(conversation)`: Calls `conversation.sync()` and returns `conversation.messages()`.
    - `sendMessage(conversation, content)`: 
        - **File Content**: Encrypts it using `RemoteAttachmentCodec.encodeEncrypted`, uploads it to IPFS, and sends the `url` & `secret` signature.
        - **String Content**: Sends standard text using `conversation.sendText()`.
    - `streamMessages(conversation, onMessage)`: Opens a continuous listener loop invoking `onMessage()` whenever peer activity hits the libp2p node.
    - `sendDeleteMessage(conversation, messageId)`: Encodes a string into the custom `DeleteCodec` schema and transmits it to the peer.
    - `sendProfileUpdateMessage(conversation, displayName, avatarUrl)`: Encodes an avatar/name object into the custom `ProfileCodec` schema.

---

### `/src/lib/` (Auxiliary Utilities)

#### `ipfs.ts`
- **Purpose**: Centralized logic for interacting with Pinata's decentralized storage.
- **Methods**:
    - `uploadFileToIPFS(file)`: Validates the JWT, creates a `PinataSDK` instance, uploads a given `File` buffer, and returns the unique `IpfsHash`.

---

### `/src/hooks/`

#### `useConversationDisplay.ts`
- **Purpose**: A React Hook that calculates the visual title, description, and avatar for any given conversation context.
- **Methods**:
    - `resolve()`: Parses the conversation to determine if it's a DM or Group. Reads `localStorage` (`profile-{peerInboxId}`) to check if the peer previously broadcasted a custom profile name/avatar via the ProfileCodec. Dispatches updates gracefully using `useState` and listens for global `profile-updated` window events so that if a user opens the chat, it dynamically re-renders if a peer updates their avatar.
