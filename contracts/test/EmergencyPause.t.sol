// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {EmergencyPause} from "../src/governance/EmergencyPause.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract EmergencyPauseTest is Test {
    EmergencyPause public pause;
    address public multiSig = makeAddr("multiSig");
    address public pauser = makeAddr("pauser");
    address public stranger = makeAddr("stranger");

    function setUp() public {
        pause = new EmergencyPause(address(this));
        pause.grantRole(pause.PAUSER_ROLE(), pauser);
        // Set multiSig as the actual admin
        pause.grantRole(pause.DEFAULT_ADMIN_ROLE(), multiSig);
    }

    function test_initialState() public {
        assertEq(uint256(pause.currentLevel()), uint256(EmergencyPause.PauseLevel.NONE));
        assertTrue(pause.canDeposit());
        assertTrue(pause.canWithdraw());
    }

    function test_setYellow() public {
        vm.prank(pauser);
        pause.setPauseLevel(EmergencyPause.PauseLevel.YELLOW, "Market volatility");

        assertEq(uint256(pause.currentLevel()), uint256(EmergencyPause.PauseLevel.YELLOW));
        assertFalse(pause.canDeposit());
        assertTrue(pause.canWithdraw());
    }

    function test_setOrange() public {
        vm.prank(pauser);
        pause.setPauseLevel(EmergencyPause.PauseLevel.ORANGE, "Protocol anomaly detected");

        assertEq(uint256(pause.currentLevel()), uint256(EmergencyPause.PauseLevel.ORANGE));
        assertFalse(pause.canDeposit());
        assertTrue(pause.canWithdraw());
    }

    function test_setRed() public {
        pause.setPauseLevel(EmergencyPause.PauseLevel.RED, "Critical vulnerability");

        assertEq(uint256(pause.currentLevel()), uint256(EmergencyPause.PauseLevel.RED));
        assertFalse(pause.canDeposit());
        assertFalse(pause.canWithdraw());
    }

    function test_setRed_requiresMultiSig_reverts() public {
        vm.prank(pauser);
        vm.expectRevert("Pause: RED requires multi-sig");
        pause.setPauseLevel(EmergencyPause.PauseLevel.RED, "Attempted by pauser");
    }

    function test_cannotDowngradeFromRedWithoutMultiSig() public {
        // Go to RED
        pause.setPauseLevel(EmergencyPause.PauseLevel.RED, "Shutdown");

        // Pauser tries to downgrade
        vm.prank(pauser);
        vm.expectRevert("Pause: RED downgrade requires multi-sig");
        pause.setPauseLevel(EmergencyPause.PauseLevel.YELLOW, "Recovering");
    }

    function test_multiSigCanDowngrade() public {
        pause.setPauseLevel(EmergencyPause.PauseLevel.RED, "Shutdown");
        pause.setPauseLevel(EmergencyPause.PauseLevel.NONE, "Resolved");

        assertEq(uint256(pause.currentLevel()), uint256(EmergencyPause.PauseLevel.NONE));
    }

    function test_emergencyShutdown() public {
        pause.emergencyShutdown("Emergency: exploit detected");

        assertEq(uint256(pause.currentLevel()), uint256(EmergencyPause.PauseLevel.RED));
    }

    function test_addControlledContract() public {
        address target = makeAddr("target");
        pause.addControlledContract(target);

        assertTrue(pause.isControlled(target));
        assertEq(pause.controlledContractCount(), 1);
    }

    function test_removeControlledContract() public {
        address target = makeAddr("target");
        pause.addControlledContract(target);
        pause.removeControlledContract(target);

        assertFalse(pause.isControlled(target));
    }

    function test_pauseHistory() public {
        vm.prank(pauser);
        pause.setPauseLevel(EmergencyPause.PauseLevel.YELLOW, "First pause");
        assertEq(pause.pauseHistoryLength(), 1);
        pause.setPauseLevel(EmergencyPause.PauseLevel.RED, "Escalated");

        assertEq(pause.pauseHistoryLength(), 2);
    }

    function test_unauthorizedPause_reverts() public {
        vm.prank(stranger);
        vm.expectRevert();
        pause.setPauseLevel(EmergencyPause.PauseLevel.YELLOW, "Unauthorized");
    }
}
