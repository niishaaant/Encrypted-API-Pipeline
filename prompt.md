Prompt for AI Coding Agent

I want you to build a simple but functional implementation of a Hybrid RSA–AES Secure Data Transmission system with the following requirements:

Architecture:

Client (JavaScript):

    Uses Web Crypto API to generate an AES-256-GCM key and IV.

    Encrypts payloads (JSON) with AES-256-GCM.

    Encrypts the AES key with the server’s RSA public key (RSA-OAEP with SHA-256).

    Sends requests to backend with:

        KeyID

        RSA-encrypted AES key

        IV (for AES)

        AES-encrypted payload (for POST requests).

    Decrypts AES-encrypted responses from backend.

BFF (Node.js + Express):

    Just acts as a proxy/relay to forward requests/responses between client and backend.

Integration Service (Node.js + Express):

    Stores RSA private keys mapped by KeyID (can use an in-memory store instead of Vault for simplicity).

    Receives requests:

        Decrypts AES key using RSA private key.

        Decrypts AES-encrypted payload (for POST).

        Processes request (just mock a JSON response).

        Encrypts response payload with AES and sends back.

Crypto requirements:

    AES-256-GCM for payload encryption/decryption.

    RSA-OAEP with SHA-256 for AES key encryption/decryption.

    Random IV per AES encryption.

    Base64 for transmitting keys and ciphertext.

Deliverables:

    A minimal working demo with 3 folders:

        client/ → Simple JS (Node or browser-based).

        bff/ → Express relay service.

        integration-service/ → Express backend service with RSA key handling.

    Provide runnable code with clear instructions (npm install, npm start).

    Include sample GET and POST request flows showing encrypted request → backend decryption → encrypted response → client decryption.

Keep it lightweight and functional, no production hardening needed. Use mock in-memory RSA key storage instead of Vault for now.