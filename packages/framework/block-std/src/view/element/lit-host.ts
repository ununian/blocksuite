/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type { StaticValue } from 'lit/static-html.js';

import { handleError } from '@blocksuite/global/exceptions';
import { Slot, assertExists } from '@blocksuite/global/utils';
import { type BlockModel, BlockViewType, type Doc } from '@blocksuite/store';
import { SignalWatcher } from '@lit-labs/preact-signals';
import {
  LitElement,
  type PropertyValues,
  type TemplateResult,
  css,
  nothing,
} from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import type { CommandManager } from '../../command/index.js';
import type { UIEventDispatcher } from '../../event/index.js';
import type { SelectionManager } from '../../selection/index.js';
import type { BlockSpec, SpecStore } from '../../spec/index.js';
import type { ViewStore } from '../view-store.js';

import { BlockStdScope } from '../../scope/index.js';
import { RangeManager } from '../utils/range-manager.js';
import { WithDisposable } from '../utils/with-disposable.js';
import { ShadowlessElement } from './shadowless-element.js';

@customElement('editor-host')
export class EditorHost extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  private _renderModel = (model: BlockModel): TemplateResult => {
    const { flavour } = model;
    const block = this.doc.getBlock(model.id);
    if (!block || block.blockViewType === BlockViewType.Hidden) {
      return html`${nothing}`;
    }
    const schema = this.doc.schema.flavourSchemaMap.get(flavour);
    const view = this.std.spec.getView(flavour);
    if (!schema || !view) {
      console.warn(`Cannot find render flavour ${flavour}.`);
      return html`${nothing}`;
    }

    const tag = view.component;
    const widgets: Record<string, TemplateResult> = view.widgets
      ? Object.entries(view.widgets).reduce((mapping, [key, tag]) => {
          const template = html`<${tag}
            ${unsafeStatic(this.widgetIdAttr)}=${key}
            .host=${this}
            .model=${model}
            .doc=${this.doc}></${tag}>`;

          return {
            ...mapping,
            [key]: template,
          };
        }, {})
      : {};

    return html`<${tag}
      ${unsafeStatic(this.blockIdAttr)}=${model.id}
      .host=${this}
      .doc=${this.doc}
      .model=${model}
      .widgets=${widgets}
      .viewType=${block.blockViewType}
    ></${tag}>`;
  };

  static override styles = css`
    editor-host {
      outline: none;
      isolation: isolate;
    }
  `;

  rangeManager: RangeManager | null = null;

  renderChildren = (model: BlockModel): TemplateResult => {
    return html`${repeat(
      model.children,
      child => child.id,
      child => this._renderModel(child)
    )}`;
  };

  /**
   * @deprecated
   *
   * This method is deprecated. Use `renderSpecPortal` instead.
   */
  renderModel = (model: BlockModel): TemplateResult => {
    return this._renderModel(model);
  };

  renderSpecPortal = (doc: Doc, specs: BlockSpec[]) => {
    return html`
      <editor-host
        .doc=${doc}
        .specs=${specs}
        contenteditable="false"
      ></editor-host>
    `;
  };

  readonly slots = {
    unmounted: new Slot(),
  };

  std!: BlockSuite.Std;

  override connectedCallback() {
    super.connectedCallback();

    if (!this.doc.root) {
      throw new Error(
        'This doc is missing root block. Please initialize the default block structure before connecting the editor to DOM.'
      );
    }

    this.std = new BlockStdScope({
      host: this,
      doc: this.doc,
    });

    this.std.mount();
    this.std.spec.applySpecs(this.specs);
    this.rangeManager = new RangeManager(this);
    this.tabIndex = 0;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.std.unmount();
    this.rangeManager = null;
    this.slots.unmounted.emit();
  }

  override async getUpdateComplete(): Promise<boolean> {
    try {
      const result = await super.getUpdateComplete();
      const rootModel = this.doc.root;
      assertExists(rootModel);
      const view = this.std.spec.getView(rootModel.flavour);
      assertExists(view);
      const widgetTags = Object.values(view.widgets ?? {});
      const elementsTags = [view.component, ...widgetTags];
      await Promise.all(
        elementsTags.map(tag => {
          const element = this.renderRoot.querySelector(tag._$litStatic$);
          if (element instanceof LitElement) {
            return element.updateComplete;
          }
          return;
        })
      );
      return result;
    } catch (e) {
      if (e instanceof Error) {
        handleError(e);
      } else {
        console.error(e);
      }
      return true;
    }
  }

  override render() {
    const { root } = this.doc;
    if (!root) return nothing;

    return this._renderModel(root);
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('specs')) {
      this.std.spec.applySpecs(this.specs);
    }
    super.willUpdate(changedProperties);
  }

  get command(): CommandManager {
    return this.std.command;
  }

  get event(): UIEventDispatcher {
    return this.std.event;
  }

  get selection(): SelectionManager {
    return this.std.selection;
  }

  get spec(): SpecStore {
    return this.std.spec;
  }

  get view(): ViewStore {
    return this.std.view;
  }

  @property({ attribute: false })
  accessor blockIdAttr = 'data-block-id';

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor specs!: BlockSpec[];

  @property({ attribute: false })
  accessor widgetIdAttr = 'data-widget-id';
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-host': EditorHost;
  }

  namespace BlockSuite {
    interface ComponentType {
      lit: StaticValue;
    }
  }
}
