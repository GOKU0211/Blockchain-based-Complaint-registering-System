// static/js/web3.js
// Uses ethers v6 (loaded via CDN in index.html) and MetaMask (window.ethereum)

const CONTRACT_ADDRESS = "0xAf811d4797C5F6e58929D9fB1c0836c710341B13";
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

const ABI = [
  "function submitComplaint(bytes32 complaintHash) returns (uint256)",
  "function getComplaint(uint256 id) view returns (bytes32, address, uint256)",
  "function totalComplaints() view returns (uint256)",
  "function verifyComplaint(uint256 id, string text) view returns (bool)",
  "event ComplaintSubmitted(uint256 indexed id, bytes32 indexed complaintHash, address indexed submitter, uint256 timestamp)"
];

let signer, contract, userAddress;

function setStatus(msg) {
  document.getElementById("status").textContent = msg;
}

async function connectWallet() {
  if (!window.ethereum) {
    setStatus("MetaMask not found. Please install it.");
    return;
  }

  // Make sure MetaMask is on Sepolia
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (err) {
    setStatus("Please switch MetaMask to the Sepolia network.");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  document.getElementById("wallet").textContent = userAddress;
  setStatus("Wallet connected.");
}

async function submitComplaint() {
  const text = document.getElementById("complaintText").value.trim();
  if (!text) return setStatus("Enter a complaint first.");
  if (!contract) return setStatus("Connect your wallet first.");

  try {
    // Must match Solidity: keccak256(abi.encodePacked(text))
    const hash = ethers.keccak256(ethers.toUtf8Bytes(text));

    setStatus("Confirm the transaction in MetaMask...");
    const tx = await contract.submitComplaint(hash);

    setStatus("Waiting for confirmation...");
    const receipt = await tx.wait();

    // Read the complaint ID from the emitted event
    let onchainId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "ComplaintSubmitted") {
          onchainId = parsed.args.id.toString();
        }
      } catch (_) {}
    }

    // Send text + proof to Flask so it goes into the custom chain
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        hash,
        txHash: tx.hash,
        onchainId,
        wallet: userAddress,
      }),
    });

    if (!res.ok) throw new Error("Server rejected the complaint");

    setStatus(`Done! On-chain ID: ${onchainId} | Tx: ${tx.hash}`);
    document.getElementById("complaintText").value = "";
  } catch (err) {
    const msg = (err.reason || err.shortMessage || err.message || "").toString();
    if (msg.includes("Already registered")) {
      setStatus("This exact complaint is already registered.");
    } else if (msg.includes("user rejected")) {
      setStatus("Transaction cancelled.");
    } else {
      setStatus("Error: " + msg);
    }
  }
}

async function verifyComplaint() {
  const id = document.getElementById("verifyId").value;
  const text = document.getElementById("verifyText").value;
  if (id === "" || !text) return setStatus("Enter an ID and the complaint text.");

  // Read-only call, works even with a provider-only setup
  const provider = new ethers.BrowserProvider(window.ethereum);
  const readOnly = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  try {
    const ok = await readOnly.verifyComplaint(id, text);
    document.getElementById("verifyResult").textContent = ok
      ? "Match: this text is unchanged."
      : "No match: text differs from what was registered.";
  } catch (err) {
    document.getElementById("verifyResult").textContent = "Invalid ID.";
  }
}

document.getElementById("connectBtn").addEventListener("click", connectWallet);
document.getElementById("submitBtn").addEventListener("click", submitComplaint);
document.getElementById("verifyBtn").addEventListener("click", verifyComplaint);