import * as Crypto from 'expo-crypto';


const POOL_SIZE = 256;


export function createSecureRandomPool(poolSize = POOL_SIZE) {
  let buffer = new Uint8Array(0);
  let index = 0;

  async function refill() {
    buffer = await Crypto.getRandomBytesAsync(poolSize);
    index = 0;
  }

  async function nextByte() {
    if (index >= buffer.length) {
      await refill();
    }
    return buffer[index++];
  }

  async function nextInt(max) {
    if (max <= 0) throw new Error('max deve ser maior que zero');
    if (max > 256) {
      throw new Error('nextInt só suporta max até 256 nesta implementação');
    }

    const limit = Math.floor(256 / max) * max;
    let byte;
    do {
      byte = await nextByte();
    } while (byte >= limit);
    return byte % max;
  }

  return { nextInt };
}