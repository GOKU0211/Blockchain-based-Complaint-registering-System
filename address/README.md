# Blockchain-Based Complaint Registration System

A secure and transparent way to manage complaints. Every complaint is stored as a hash-linked block, so records cannot be silently deleted, ignored, or modified. Each complaint's hash is also anchored on the Ethereum Sepolia testnet through a Solidity smart contract.

## Problem

- Complaint systems often lack transparency
- Complaints get deleted, ignored, or altered by authorities
- Users have no proof of submission and no complaint history

## Solution

Each complaint goes through two layers of protection:

1. **Custom chain (Python):** the complaint becomes a block (text, timestamp, hash, previous hash). Changing any old block breaks every hash after it, which `/verify` detects.
2. **Smart contract (Solidity):** the `keccak256` hash of the complaint is written on-chain from the user's own MetaMask wallet. Only the hash is public, never the text.

## How It Works

1. The user connects MetaMask (Sepolia network) in the browser.
2. The browser hashes the complaint text with `keccak256`.
3. MetaMask asks the user to confirm the transaction to `ComplaintRegistry`.
4. Once mined, the browser reads the on-chain complaint ID from the emitted event.
5. The browser sends the text, hash, tx hash, and wallet address to Flask.
6. Flask adds a new block to the custom chain and saves it to `data/chain.json`.

No private key is stored on the server. MetaMask signs everything in the browser.

## Features

- Complaint submission with MetaMask wallet
- Timestamped, hash-linked storage of every complaint
- On-chain proof of each complaint hash
- Public view of the full chain (`/chain`)
- Chain integrity check (`/verify`)
- On-chain verification: paste an ID and the exact text to confirm it is unchanged
- Append-only contract: no edit or delete functions

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript, ethers.js v6
- **Backend:** Python, Flask
- **Blockchain:** custom Python chain + Solidity contract on Sepolia
- **Wallet:** MetaMask
- **Tools:** Remix IDE (compile and deploy), VS Code, Git and GitHub

## Project Structure

```
Blockchain-based-Complaint-registering-System/
├── .gitignore
├── README.md
└── complaint-blockchain/
    ├── app.py                  # Flask app and routes
    ├── blockchain.py           # Block and Blockchain classes
    ├── requirements.txt
    ├── data/
    │   └── chain.json          # Persisted chain
    ├── contracts/
    │   └── ComplaintRegistry.sol
    ├── templates/
    │   └── index.html          # Submit and verify UI
    └── static/
        └── js/web3.js          # MetaMask + ethers.js logic
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/Blockchain-based-Complaint-registering-System.git
cd Blockchain-based-Complaint-registering-System

python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

pip install flask
```

### 2. Run the app

```bash
cd complaint-blockchain
python app.py
```

Open `http://localhost:5000`.

### 3. Set up MetaMask

- Install MetaMask and switch to the **Sepolia** test network
- Get free test ETH from a Sepolia faucet
- Click **Connect MetaMask** on the page

### 4. Using your own contract (optional)

The app points to an already deployed contract. To deploy your own:

1. Open [Remix](https://remix.ethereum.org) and paste `contracts/ComplaintRegistry.sol`
2. Compile with Solidity 0.8.20 or higher
3. Deploy with Environment set to **Browser Extension** (MetaMask on Sepolia)
4. Copy the contract address into `CONTRACT_ADDRESS` in `static/js/web3.js`

## Deployed Contract (Sepolia)

```
0xAf811d4797C5F6e58929D9fB1c0836c710341B13
```

[View on Blockscout](https://eth-sepolia.blockscout.com/address/0xAf811d4797C5F6e58929D9fB1c0836c710341B13?tab=contract)

## Routes

| Route | Description |
|---|---|
| `/` | Submit and verify complaints |
| `/api/complaints` | POST endpoint that adds a block |
| `/chain` | All blocks as JSON |
| `/verify` | Chain integrity check |

## Smart Contract

`ComplaintRegistry.sol` stores the hash, submitter address, and timestamp of each complaint.

| Function | Purpose |
|---|---|
| `submitComplaint(bytes32 hash)` | Register a complaint hash |
| `getComplaint(uint256 id)` | Read a record |
| `totalComplaints()` | Number of complaints |
| `verifyComplaint(uint256 id, string text)` | Check a text against the stored hash |

## Tamper Test

1. Submit a complaint
2. Open `data/chain.json` and change any text
3. Visit `/verify`. It reports `valid: false` and the broken block index.

## Applications

- College and hostel complaint systems
- Apartment society maintenance requests
- Employee feedback tracking
- Public service grievances

## Limitations

- The custom chain runs on one server, so the host could edit `chain.json`. The on-chain hashes are what prove the original text.
- Flask currently trusts the data sent by the browser. A stronger version would re-hash the text and confirm the transaction on-chain before adding a block.
- `/chain` exposes complaint text publicly. Show only hashes for sensitive complaints.
- Each submission costs a small amount of Sepolia test ETH.

## License

MIT