export const isValidTxHash = (txHash) => /^0x([A-Fa-f0-9]{64})$/.test(txHash)
