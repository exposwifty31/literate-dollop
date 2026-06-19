export const Ndef = {
  TNF_WELL_KNOWN: 1,
  uri: {
    decodePayload: (_payload: number[] | Uint8Array) => "",
  },
  text: {
    decodePayload: (payload: number[] | Uint8Array) => {
      const bytes = payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
      const languageCodeLength = bytes[0] & 0x3f;
      return String.fromCharCode(...bytes.slice(languageCodeLength + 1));
    },
  },
};

export const NfcTech = {
  Ndef: "Ndef",
};

export default {
  start: async () => {},
  stop: async () => {},
  isSupported: async () => true,
  requestTechnology: async () => {},
  cancelTechnologyRequest: async () => {},
  getTag: async () => ({ id: "04123456", ndefMessage: [] }),
  setEventListener: () => {},
};
