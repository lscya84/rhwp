import type { CommandServices } from "./command/types";
import { prepareFilemaruExport } from "./command/commands/file";
import type { WasmBridge } from './core/wasm-bridge';
import type { EventBus } from './core/event-bus';
import type { CommandRegistry } from './command/registry';
import type { DocumentDirtyState } from './core/document-dirty-state';

type HostCommand = {
  type: 'filemaru-host';
  command: 'load' | 'new' | 'export' | 'saved';
  bytes?: Uint8Array;
  name?: string;
  revision?: number;
  format?: 'hwp' | 'hwpx' | 'hml';
};

export function storageName(name: string): string {
  const account = new URLSearchParams(location.search).get('account');

  return `filemaru-${account ?? 'standalone'}-${name}`;
}

export function installFilemaru(
  wasm: WasmBridge,
  services: CommandServices,
  eventBus: EventBus,
  registry: CommandRegistry,
  state: DocumentDirtyState,
  ready: Promise<void>,
  load: (bytes: Uint8Array, name: string) => Promise<void>,
  create: () => Promise<void>,
  saved: (name?: string) => Promise<{ ok: true; wasDirty: boolean }>,
): void {
  let revision = 0;
  let exportFormat: 'hwp' | 'hwpx' | undefined;
  let saveAs = false;
  let exportProtection = false;
  const post = (event: string) => window.parent.postMessage({ type: 'filemaru-hangul', event }, location.origin);
  const mutate = () => { revision += 1; post('dirty'); };

  eventBus.on('document-mutated', mutate);
  eventBus.on('document-changed', mutate);
  eventBus.on('document-dirty-changed', () => post(state.isDirty() ? 'dirty' : 'clean'));

  for (const id of ['file:open', 'file:open-recent']) {
    const command = registry.get(id);

    if (command) registry.register({ ...command, execute: () => post('open') });
  }

  for (const id of ['file:save', 'file:save-as', 'file:save-as-hwp', 'file:save-as-hwpx']) {
    const command = registry.get(id);

    if (command) registry.register({ ...command, execute: () => {
      exportFormat = id === 'file:save-as-hwp' ? 'hwp' : id === 'file:save-as-hwpx' ? 'hwpx' : undefined;
      saveAs = id !== 'file:save';
      post('save');
    } });
  }

  const newCommand = registry.get('file:new-doc');

  if (newCommand) registry.register({ ...newCommand, execute: async () => {
    if (state.isDirty() && !confirm('저장하지 않은 변경을 버리고 새 문서를 만드시겠습니까?')) return;
    await create(); revision += 1; post('loaded');

 if (state.isDirty()) post('dirty');
  } });
  // Apply the host boundary to the retained upstream embed API as well.
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== location.origin) event.stopImmediatePropagation();
  }, { capture: true });
  window.addEventListener('message', async (event: MessageEvent<HostCommand>) => {
    if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'filemaru-host') return;

    try {
      await ready;
      const message = event.data;

      if (message.command === 'load') {
        if (!(message.bytes instanceof Uint8Array) || !message.name) throw new Error('잘못된 문서');
        await load(message.bytes, message.name);
        revision += 1; exportFormat = undefined; post('loaded');
      } else if (message.command === 'new') {
        await create(); revision += 1; post('loaded');

 if (state.isDirty()) post('dirty');
      } else if (message.command === 'export') {
        post('prompt');
        const artifact = await prepareFilemaruExport(services, saveAs, message.format ?? exportFormat);
        saveAs = false; exportFormat = undefined;

        if (!artifact) { post('cancel');

 return; }

        const snapshotRevision = revision;
        exportProtection = artifact.passwordProtected;
        const buffer = await artifact.blob.arrayBuffer();
        window.parent.postMessage({ type: 'filemaru-hangul', event: 'export', bytes: buffer, name: artifact.name, revision: snapshotRevision }, location.origin, [buffer]);
      } else if (message.command === 'saved' && message.revision === revision) {
        wasm.requiresPasswordForSave = exportProtection;
        await saved(message.name); post('clean');
      }
    } catch { post('error'); }
  });
  void ready.then(() => post('ready')).catch(() => post('error'));
}
