// Every game action returns one of these, so the UI always knows whether
// the action really happened and why not.
export const ok = (data = {}) => ({ ok: true, events: [], ...data });
export const fail = (reason) => ({ ok: false, reason, events: [] });
