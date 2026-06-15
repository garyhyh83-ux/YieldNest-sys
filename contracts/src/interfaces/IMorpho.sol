// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;

/// @notice Minimal Morpho Blue interface.
/// Covers the supply/withdraw functions and market data queries.
interface IMorpho {
    struct MarketParams {
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }

    struct Market {
        uint256 totalSupplyAssets;
        uint256 totalSupplyShares;
        uint256 totalBorrowAssets;
        uint256 totalBorrowShares;
        uint256 lastUpdate;
        uint256 fee;
    }

    function supply(
        MarketParams calldata marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        bytes calldata data
    ) external returns (uint256 _assets, uint256 _shares);

    function withdraw(
        MarketParams calldata marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256 _assets, uint256 _shares);

    function market(MarketParams calldata marketParams) external view returns (Market memory);

    function idToMarketParams(bytes32 id) external view returns (MarketParams memory);
}
