// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ComplaintRegistry
/// @notice Stores only the hash of each complaint (not the text) plus timestamp
///         and submitter. Records are append-only: no edit, no delete.
contract ComplaintRegistry {
    struct Complaint {
        bytes32 complaintHash; // keccak256 of the complaint text (computed off-chain)
        address submitter;
        uint256 timestamp;
    }

    Complaint[] private complaints;
    mapping(bytes32 => bool) public hashExists;

    event ComplaintSubmitted(
        uint256 indexed id,
        bytes32 indexed complaintHash,
        address indexed submitter,
        uint256 timestamp
    );

    /// @notice Register a complaint hash on-chain.
    /// @param complaintHash keccak256 hash of the complaint text (+ optional salt)
    /// @return id index of the new complaint
    function submitComplaint(bytes32 complaintHash) external returns (uint256 id) {
        require(complaintHash != bytes32(0), "Empty hash");
        require(!hashExists[complaintHash], "Already registered");

        hashExists[complaintHash] = true;
        complaints.push(Complaint(complaintHash, msg.sender, block.timestamp));
        id = complaints.length - 1;

        emit ComplaintSubmitted(id, complaintHash, msg.sender, block.timestamp);
    }

    /// @notice Read a complaint record by id.
    function getComplaint(uint256 id)
        external
        view
        returns (bytes32 complaintHash, address submitter, uint256 timestamp)
    {
        require(id < complaints.length, "Invalid id");
        Complaint storage c = complaints[id];
        return (c.complaintHash, c.submitter, c.timestamp);
    }

    /// @notice Total number of complaints registered.
    function totalComplaints() external view returns (uint256) {
        return complaints.length;
    }

    /// @notice Check that a complaint text matches what was registered at `id`.
    /// @dev Pass the exact same text (and salt, if used) that was hashed off-chain.
    function verifyComplaint(uint256 id, string calldata text) external view returns (bool) {
        require(id < complaints.length, "Invalid id");
        return complaints[id].complaintHash == keccak256(abi.encodePacked(text));
    }
}
