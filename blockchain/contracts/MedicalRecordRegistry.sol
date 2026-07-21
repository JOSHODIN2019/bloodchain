// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title MedicalRecordRegistry
 * @notice Tamper-proof on-chain registry for medical record hashes and access control logs.
 *         Records are stored by SHA-256 hash; content lives off-chain on IPFS.
 *         Integrity is verified by comparing the on-chain hash against the current file hash.
 */
contract MedicalRecordRegistry {

    // ─── Structs ────────────────────────────────────────────────────────────

    struct RecordEntry {
        bytes32 sha256Hash;   // SHA-256 of the encrypted file
        string  ipfsHash;     // CID on IPFS
        address patient;      // Patient's wallet address
        address uploader;     // Who uploaded (doctor or patient)
        uint256 timestamp;    // Block timestamp
        bool    isVerified;   // Admin-verified flag
    }

    struct AccessEntry {
        address patient;
        address doctor;
        bool    granted;       // true = grant, false = revoke
        uint256 timestamp;
    }

    // ─── State ──────────────────────────────────────────────────────────────

    address public admin;

    // sha256Hash → record details
    mapping(bytes32 => RecordEntry) private _records;

    // patient wallet → list of record hashes
    mapping(address => bytes32[]) private _patientRecords;

    // Append-only access log
    AccessEntry[] private _accessLog;

    // ─── Events ─────────────────────────────────────────────────────────────

    event RecordRegistered(
        bytes32 indexed sha256Hash,
        string          ipfsHash,
        address indexed patient,
        address indexed uploader,
        uint256         timestamp
    );

    event RecordVerified(
        bytes32 indexed sha256Hash,
        address indexed verifiedBy,
        uint256         timestamp
    );

    event AccessChanged(
        address indexed patient,
        address indexed doctor,
        bool            granted,
        uint256         timestamp
    );

    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "MedRec: caller is not admin");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
        emit AdminTransferred(address(0), msg.sender);
    }

    // ─── Record Functions ────────────────────────────────────────────────────

    /**
     * @notice Register a medical record hash on-chain.
     * @param sha256Hash  SHA-256 hash (bytes32) of the encrypted file.
     * @param ipfsHash    IPFS CID string where the encrypted file is stored.
     * @param patient     Wallet address of the patient the record belongs to.
     */
    function registerRecord(
        bytes32        sha256Hash,
        string calldata ipfsHash,
        address        patient
    ) external returns (bool) {
        require(sha256Hash != bytes32(0),           "MedRec: hash cannot be zero");
        require(bytes(ipfsHash).length > 0,         "MedRec: IPFS hash required");
        require(patient != address(0),              "MedRec: invalid patient address");
        require(_records[sha256Hash].timestamp == 0, "MedRec: record already registered");

        _records[sha256Hash] = RecordEntry({
            sha256Hash: sha256Hash,
            ipfsHash:   ipfsHash,
            patient:    patient,
            uploader:   msg.sender,
            timestamp:  block.timestamp,
            isVerified: false
        });

        _patientRecords[patient].push(sha256Hash);

        emit RecordRegistered(sha256Hash, ipfsHash, patient, msg.sender, block.timestamp);
        return true;
    }

    /**
     * @notice Mark a record as admin-verified (tamper check passed).
     */
    function verifyRecord(bytes32 sha256Hash) external onlyAdmin {
        require(_records[sha256Hash].timestamp > 0, "MedRec: record not found");
        require(!_records[sha256Hash].isVerified,   "MedRec: already verified");
        _records[sha256Hash].isVerified = true;
        emit RecordVerified(sha256Hash, msg.sender, block.timestamp);
    }

    /**
     * @notice Log a patient granting or revoking doctor access.
     */
    function logAccess(
        address patient,
        address doctor,
        bool    granted
    ) external {
        require(patient != address(0), "MedRec: invalid patient");
        require(doctor  != address(0), "MedRec: invalid doctor");

        _accessLog.push(AccessEntry({
            patient:   patient,
            doctor:    doctor,
            granted:   granted,
            timestamp: block.timestamp
        }));

        emit AccessChanged(patient, doctor, granted, block.timestamp);
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    /**
     * @notice Check whether a record exists and its verification status.
     */
    function verifyIntegrity(bytes32 sha256Hash)
        external
        view
        returns (bool exists, bool isVerified, uint256 timestamp)
    {
        RecordEntry storage r = _records[sha256Hash];
        exists     = r.timestamp > 0;
        isVerified = r.isVerified;
        timestamp  = r.timestamp;
    }

    /**
     * @notice Get full record details.
     */
    function getRecord(bytes32 sha256Hash)
        external
        view
        returns (RecordEntry memory)
    {
        return _records[sha256Hash];
    }

    /**
     * @notice Get all record hashes belonging to a patient.
     */
    function getPatientRecords(address patient)
        external
        view
        returns (bytes32[] memory)
    {
        return _patientRecords[patient];
    }

    /**
     * @notice Get total number of access log entries.
     */
    function getAccessLogLength() external view returns (uint256) {
        return _accessLog.length;
    }

    /**
     * @notice Get a specific access log entry by index.
     */
    function getAccessEntry(uint256 index)
        external
        view
        returns (AccessEntry memory)
    {
        require(index < _accessLog.length, "MedRec: index out of bounds");
        return _accessLog[index];
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "MedRec: zero address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }
}
