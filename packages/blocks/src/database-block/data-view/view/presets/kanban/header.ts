import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { DataViewKanbanManager } from './kanban-view-manager.js';

import { popMenu } from '../../../../../_common/components/index.js';
import './card.js';

const styles = css`
  affine-data-view-kanban-header {
    display: flex;
    justify-content: space-between;
    padding: 4px;
  }

  .select-group {
    border-radius: 8px;
    padding: 4px 8px;
    cursor: pointer;
  }

  .select-group:hover {
    background-color: var(--affine-hover-color);
  }
`;

@customElement('affine-data-view-kanban-header')
export class KanbanHeader extends WithDisposable(ShadowlessElement) {
  private clickGroup = (e: MouseEvent) => {
    popMenu(e.target as HTMLElement, {
      options: {
        input: {
          search: true,
        },
        items: this.view.columnManagerList
          .filter(column => column.id !== this.view.view.groupBy?.columnId)
          .map(column => {
            return {
              type: 'action',
              name: column.name,
              select: () => {
                this.view.changeGroup(column.id);
              },
            };
          }),
      },
    });
  };

  static override styles = styles;

  override render() {
    return html`
      <div></div>
      <div>
        <div class="select-group" @click="${this.clickGroup}">Group</div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor view!: DataViewKanbanManager;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-header': KanbanHeader;
  }
}
