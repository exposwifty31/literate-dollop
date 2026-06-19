export const Ndef = {
  TNF_WELL_KNOWN: 1,
  uri: {
    decodePayload: (_payload: number[] | Uint8Array) => "",
  },
  text: {
    decodePayload: (_payload: number[] | Uint8Array) => ({ lang: "en", text: "" }),
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
