# Blockchain-Based Complaint Registration System

A secure and transparent way to manage complaints. Every complaint is stored as a hash-linked block, so records cannot be silently deleted, ignored, or modified. Complaint hashes can also be anchored on-chain through a Solidity smart contract.

## Problem

- Complaint systems often lack transparency
- Complaints get deleted, ignored, or altered by authorities
- Users have no proof of submission and no complaint history

## Solution

Each complaint submitted through the web form becomes a block containing:

| Field | Purpose |
|---|---|
| Complaint text | The submitted complaint |
| Timestamp | When it was filed |
| Hash | SHA-256 of the block's contents |
| Previous hash | Link to the prior block |

Changing any past block breaks every hash after it, which makes tampering instantly detectable. The full chain is publicly viewable and verifiable.

## Features

- Web interface for complaint submission
- Timestamped, hashed storage of every complaint
- Public view of the entire complaint history
- Chain integrity verification
- Read-only admin view (no delete or modify)
- Optional on-chain anchoring via `ComplaintRegistry.sol`

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python (Flask)
- **Blockchain:** Custom lightweight chain in Python, plus optional Solidity contract
- **Database:** MongoDB / Firebase (user authentication)
- **Version control:** Git and GitHub

## Project Structure

```
complaint-blockchain/
├── app.py                  # Flask app and routes
├── blockchain.py           # Block and Blockchain classes
├── auth.py                 # Login / admin auth
├── config.py               # DB URI, secret key
├── requirements.txt
├── data/
│   └── chain.json          # Persisted chain
├── contracts/
│   └── ComplaintRegistry.sol
├── templates/              # base, index, chain, verify, login, admin
├── static/                 # css/ and js/
└── tests/
    └── test_blockchain.py
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/complaint-blockchain.git
cd complaint-blockchain

# Create a virtual environment and install dependencies
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the app
python app.py
```

Open `http://localhost:5000` in your browser.

## Routes

| Route | Description |
|---|---|
| `/` | Submit a complaint |
| `/chain` | Public view of all blocks |
| `/verify` | Check chain integrity |
| `/admin` | Read-only admin view (login required) |

## Smart Contract (Optional)

`contracts/ComplaintRegistry.sol` stores only the `keccak256` hash of each complaint, along with the submitter address and timestamp. It is append-only, with no edit or delete functions.

- `submitComplaint(bytes32 hash)` registers a complaint hash
- `getComplaint(uint256 id)` reads a record
- `totalComplaints()` returns the count
- `verifyComplaint(uint256 id, string text)` checks a text against the stored hash

Deploy to a testnet such as Sepolia using [Remix](https://remix.ethereum.org) or Hardhat. Only hashes go on-chain, so complaint text stays private.

## Applications

- College and hostel complaint systems
- Apartment society maintenance requests
- Employee feedback tracking
- Public service grievances

## Limitations

- The custom chain is hosted on a single server, so the host could still edit `chain.json`. Anchoring hashes on a public chain addresses this.
- Public chain view means complaint content is visible to everyone. Consider showing only hashes publicly for sensitive complaints.

## License

MIT