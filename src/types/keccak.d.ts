declare module 'keccak' {
  interface KeccakHasher {
    update(data: Buffer | string): KeccakHasher;
    digest(): Buffer;
    digest(encoding: 'hex'): string;
  }

  export default function keccak(algorithm: string): KeccakHasher;
}