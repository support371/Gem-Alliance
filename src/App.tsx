import { useCallback, useEffect, useState } from 'react';
import { createPublicClient, http, isAddress, namehash, parseAbi, type Address } from 'viem';
import { base, mainnet } from 'viem/chains';

const BASENAME = 'allianceforward.base.eth';
const BASE_RPC = 'https://mainnet.base.org';
const publicClient = createPublicClient({ chain: base, transport: http(BASE_RPC) });

type Resolution = { address: Address | null; status: 'checking' | 'resolved' | 'unresolved' | 'error'; message: string };

declare global {
  interface Window { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }
}

function shortAddress(value: string) {
  return value.length > 13 ? value.slice(0, 6) + '…' + value.slice(-4) : value;
}

export default function App() {
  const [resolution, setResolution] = useState<Resolution>({ address: null, status: 'checking', message: 'Checking the Base name record…' });
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState('Wallet not connected');
  const [busy, setBusy] = useState(false);

  const resolveName = useCallback(async () => {
    setResolution({ address: null, status: 'checking', message: 'Checking the Base name record…' });
    try {
      // Query the Base chain's ENS-compatible resolver. Never assume the name resolves.
      const address = await publicClient.getEnsAddress({ name: BASENAME });
      if (address && isAddress(address)) {
        setResolution({ address, status: 'resolved', message: 'A resolver returned an address on Base.' });
      } else {
        setResolution({ address: null, status: 'unresolved', message: 'No address was returned by this resolver. This does not prove the name is unregistered; the name may require the Basename-specific resolution path.' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown resolution error';
      setResolution({ address: null, status: 'error', message: 'Could not confirm the name through the configured Base resolver. ' + message.slice(0, 180) });
    }
  }, []);

  useEffect(() => { void resolveName(); }, [resolveName]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setWalletMessage('No injected wallet detected. Open this dashboard in a browser with a compatible wallet.');
      return;
    }
    setBusy(true);
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      if (chainId?.toLowerCase() !== '0x2105') {
        setWalletMessage('Wallet detected, but it is not on Base Mainnet. Switch networks in your wallet and try again.');
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const account = accounts?.[0];
      if (!account || !isAddress(account)) {
        setWalletMessage('Wallet connection did not return a valid address.');
        return;
      }
      setWallet(account);
      if (resolution.address) {
        setWalletMessage(account.toLowerCase() === resolution.address.toLowerCase()
          ? 'Address matches the currently resolved Basename record.'
          : 'Connected address does not match the currently resolved Basename record.');
      } else {
        setWalletMessage('Wallet connected. Ownership cannot be compared until the Basename resolves.');
      }
    } catch (error) {
      setWalletMessage(error instanceof Error ? error.message : 'Wallet connection was cancelled or failed.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!wallet) return;
    setWalletMessage(resolution.address
      ? (wallet.toLowerCase() === resolution.address.toLowerCase()
        ? 'Address matches the currently resolved Basename record.'
        : 'Connected address does not match the currently resolved Basename record.')
      : 'Wallet connected. Ownership cannot be compared until the Basename resolves.');
  }, [wallet, resolution.address]);

  const statusLabel = resolution.status === 'resolved' ? 'Record returned' : resolution.status === 'checking' ? 'Checking' : resolution.status === 'unresolved' ? 'Not confirmed' : 'Resolution error';

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Alliance Forward home"><span className="brand-mark">AF</span><span><b>ALLIANCE FORWARD</b><small>WEB3 IDENTITY LAYER</small></span></a>
        <span className="network-pill"><i /> Base Mainnet · Chain 8453</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="pulse" /> IDENTITY CONSOLE</div>
        <h1>One identity.<br /><em>Verified connections.</em></h1>
        <p className="intro">A standalone verification workspace for your Basename and wallet. This dashboard checks public records; it does not deploy contracts, move funds, or grant administrative permissions.</p>
      </section>

      <section className="grid">
        <article className="card identity-card">
          <div className="card-head"><span className="label">PRIMARY WEB3 IDENTITY</span><span className={'status ' + resolution.status}><i />{statusLabel}</span></div>
          <div className="identity-name">{BASENAME}</div>
          <p className="muted">Configured identity · Base ecosystem</p>
          <div className="divider" />
          <div className="detail-row"><span>Resolved wallet</span><strong>{resolution.address ? shortAddress(resolution.address) : 'Not confirmed'}</strong></div>
          {resolution.address && <div className="address-box">{resolution.address}</div>}
          <p className="resolution-message">{resolution.message}</p>
          <div className="actions"><button className="button primary" onClick={() => void resolveName()} disabled={resolution.status === 'checking'}>{resolution.status === 'checking' ? 'Checking…' : 'Recheck identity'}</button><a className="button secondary" href="https://www.base.org/names" target="_blank" rel="noreferrer">Open Base Names ↗</a></div>
        </article>

        <article className="card wallet-card">
          <div className="card-head"><span className="label">WALLET CHECK</span><span className="tag">READ-ONLY CHECK</span></div>
          <div className="wallet-icon">⌘</div>
          <h2>Verify your connection</h2>
          <p className="muted">Connect a wallet on Base Mainnet to compare its address with the resolved record. No signature or transaction is requested.</p>
          <button className="button primary full" onClick={() => void connectWallet()} disabled={busy}>{busy ? 'Connecting…' : wallet ? 'Wallet connected · ' + shortAddress(wallet) : 'Connect wallet'}</button>
          <div className="notice">{walletMessage}</div>
          {wallet && <button className="text-button" onClick={() => { setWallet(null); setWalletMessage('Wallet not connected'); }}>Disconnect from this dashboard</button>}
        </article>
      </section>

      <section className="section-heading"><div><span className="label">INTEGRATION ROADMAP</span><h2>Designed to connect. Not yet connected.</h2></div><span className="phase">PHASE 1 / 4</span></section>
      <section className="roadmap">
        <div className="roadmap-item active"><span className="step">01</span><div><b>Identity resolution</b><p>Check the name and show what the resolver actually returns.</p></div><span className="step-state">IN TEST</span></div>
        <div className="roadmap-item"><span className="step">02</span><div><b>Independent project verification</b><p>Verify Crypto Signal Bot and GEM Copy Center separately before any connection.</p></div><span className="step-state pending">NEXT</span></div>
        <div className="roadmap-item"><span className="step">03</span><div><b>Access control</b><p>Use authenticated sessions and explicit wallet authorization—not the Basename alone.</p></div><span className="step-state pending">PLANNED</span></div>
        <div className="roadmap-item"><span className="step">04</span><div><b>Optional transaction services</b><p>Only add contract administration or payment routing after review and testnet validation.</p></div><span className="step-state pending">PLANNED</span></div>
      </section>
      <footer><span>ALLIANCE FORWARD · IDENTITY WORKSPACE</span><span>Public-chain reads only · No private keys collected</span></footer>
    </main>
  );
}
