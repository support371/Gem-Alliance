# Alliance Forward — Web3 Identity Dashboard

Standalone Phase 1 workspace for the Basename `allianceforward.base.eth`.

## Scope

- Attempts to resolve the configured Basename using the Base Mainnet public RPC.
- Displays the actual resolution result and errors; it does not assume that the name resolves.
- Offers an injected-wallet connection on Base Mainnet and compares the connected address with a successfully resolved address.
- Requests no message signature and submits no transactions.
- Does not deploy contracts, hold private keys, route payments, or grant app administrator access.

## Run locally

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

## Validate a production build

```bash
npm run check
npm run build
npm run preview
```

## Important resolution note

Basename resolution may require the network-specific resolver configuration supported by the current Base Basename implementation. The dashboard intentionally displays an unresolved/error state rather than treating a failed lookup as proof of ownership or registration. Verify against the official Base documentation and a trusted resolver before using any result for access control.

## Next phases

1. Confirm identity resolution and wallet matching.
2. Independently test the Crypto Signal Bot and GEM Copy Center.
3. Add explicit authenticated permissions only after the project architecture is reviewed.
4. Consider optional transaction functions only after testnet validation and explicit approval.

No real-fund transaction functionality is enabled in this phase.
