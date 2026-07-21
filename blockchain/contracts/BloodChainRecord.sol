// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BloodChainRecord {

    struct DonationRecord {
        string  donationId;
        string  donorId;
        string  bloodBankId;
        string  bloodType;
        uint256 units;
        string  status;        // "confirmed" | "rejected"
        uint256 timestamp;
        bool    exists;
    }

    struct RequestRecord {
        string  requestId;
        string  hospitalId;
        string  bloodBankId;
        string  bloodType;
        uint256 units;
        string  status;        // "fulfilled" | "rejected"
        uint256 timestamp;
        bool    exists;
    }

    address public admin;

    mapping(string => DonationRecord) public donations;
    mapping(string => RequestRecord)  public requests;

    string[] public donationIds;
    string[] public requestIds;

    event DonationRecorded(string indexed donationId, string donorId, string bloodBankId, string bloodType, uint256 units, string status, uint256 timestamp);
    event RequestRecorded(string indexed requestId, string hospitalId, string bloodBankId, string bloodType, uint256 units, string status, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorised");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function recordDonation(
        string calldata donationId,
        string calldata donorId,
        string calldata bloodBankId,
        string calldata bloodType,
        uint256 units,
        string calldata status
    ) external onlyAdmin {
        require(!donations[donationId].exists, "Already recorded");
        uint256 ts = block.timestamp;
        donations[donationId] = DonationRecord(donationId, donorId, bloodBankId, bloodType, units, status, ts, true);
        donationIds.push(donationId);
        emit DonationRecorded(donationId, donorId, bloodBankId, bloodType, units, status, ts);
    }

    function recordBloodRequest(
        string calldata requestId,
        string calldata hospitalId,
        string calldata bloodBankId,
        string calldata bloodType,
        uint256 units,
        string calldata status
    ) external onlyAdmin {
        require(!requests[requestId].exists, "Already recorded");
        uint256 ts = block.timestamp;
        requests[requestId] = RequestRecord(requestId, hospitalId, bloodBankId, bloodType, units, status, ts, true);
        requestIds.push(requestId);
        emit RequestRecorded(requestId, hospitalId, bloodBankId, bloodType, units, status, ts);
    }

    function getDonation(string calldata donationId) external view returns (DonationRecord memory) {
        return donations[donationId];
    }

    function getRequest(string calldata requestId) external view returns (RequestRecord memory) {
        return requests[requestId];
    }

    function totalDonations() external view returns (uint256) {
        return donationIds.length;
    }

    function totalRequests() external view returns (uint256) {
        return requestIds.length;
    }
}
