import type { BlockModel } from '@blocksuite/store';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { property } from 'lit/decorators.js';

import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import type { EdgelessBlockPortalContainer } from './edgeless-block-portal.js';

import { requestConnectedFrame } from '../../../../_common/utils/event.js';

export class EdgelessPortalBase<T extends BlockModel> extends WithDisposable(
  ShadowlessElement
) {
  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.model.propsUpdated.on(() => {
        if (this.hasUpdated) this.requestUpdate();
      })
    );
  }

  protected renderModel(model: T) {
    return this.surface.host.renderModel(model);
  }

  protected override scheduleUpdate(): void | Promise<unknown> {
    const { promise, resolve } = Promise.withResolvers<void>();
    const detect = () => {
      if (this.updatingSet.size < this.concurrentUpdatingCount) {
        this.updatingSet.add(this.model.id);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        super.scheduleUpdate();

        requestConnectedFrame(() => {
          this.updatingSet.delete(this.model.id);
        }, this);
        resolve();
      } else {
        requestConnectedFrame(detect, this);
      }
    };

    detect();

    return promise;
  }

  @property({ attribute: false })
  accessor concurrentUpdatingCount!: number;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor index!: number;

  @property({ attribute: false })
  accessor model!: T;

  @property({ attribute: false })
  accessor portalContainer!: EdgelessBlockPortalContainer;

  @property({ attribute: false })
  accessor surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  accessor updatingSet!: Set<string>;
}
