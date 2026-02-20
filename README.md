# dChat

<div align="center">
  <img src="./public/dChat.svg" alt="dChat Banner" width="100%">
  <br />
  
  <h3>Secure. Decentralized. Privacy-First Messaging.</h3>
  
  <p align="center">
    <a href="https://d-chatapp.vercel.app"><b>Live Demo</b></a> •
    <a href="#key-features">Features</a> •
    <a href="./project_overview.md">Documentation</a> •
    <a href="https://github.com/Swadesh-c0de/dChat/issues">Report Bug</a>
  </p>

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![XMTP](https://img.shields.io/badge/XMTP-V3-orange?style=for-the-badge)](https://xmtp.org/)

</div>

---

## 🚀 Overview

**dChat** is a cutting-edge decentralized messaging platform built on the **XMTP (Extensible Message Transport Protocol)**. It empowers users with end-to-end encrypted, wallet-to-wallet communication, ensuring that your data remains yours—private, secure, and permanent on the decentralized web.

<div align="center">
  <a href="https://d-chatapp.vercel.app">
    <img src="https://img.shields.io/badge/LAUNCH_APPLICATION-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Launch App">
  </a>
  <a href="./project_overview.md">
    <img src="https://img.shields.io/badge/PROJECT_OVERVIEW-059669?style=for-the-badge&logo=read-the-docs&logoColor=white" alt="View Documentation">
  </a>
</div>

---

## ✨ Key Features

- 🔐 **Wallet-to-Wallet**: Instant messaging between any Ethereum-compatible addresses.
- 🛡️ **End-to-End Encryption**: Military-grade security powered by XMTP V3 (MLS protocol).
- 📁 **Private File Sharing**: Secure attachments (Images, PDF, etc.) via encrypted IPFS uploads.
- ⚡ **Real-time Sync**: Seamless message streaming and instant notifications across devices.
- 🌘 **Cinematic UI**: A premium dark-mode aesthetic with noise-overlays and fluid animations.
- 📱 **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile screens.
- 🗑️ **Delete for Everyone**: Full control over your sent messages with withdrawal support.
- 🔄 **Session Management**: Advanced device installation management and revocation.

---

## 🛠️ Tech Stack

### Core
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Web3 & Protocol
- **Messaging**: [@xmtp/browser-sdk](https://xmtp.org/) (V3)
- **Wallet Connection**: [RainbowKit](https://www.rainbowkit.com/) & [Wagmi](https://wagmi.sh/)
- **Decentralized Storage**: [Pinata IPFS](https://www.pinata.cloud/)
- **Blockchain Utils**: [Viem](https://viem.sh/)

---

## 📁 Project Structure

```bash
src/
├── app/          # App Router & Page Definitions
├── components/   # UI System & Specialized Chat Modules
├── hooks/        # Custom React Hooks for Protocol & UI
├── lib/          # Core Logic: XMTP, IPFS, & Utilities
└── types/        # Global TypeScript Definitions
```

> [!TIP]
> For a deep dive into the architecture and implementation details, check out the [Technical Project Overview](./project_overview.md).

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for the Decentralized Web.
</p>
