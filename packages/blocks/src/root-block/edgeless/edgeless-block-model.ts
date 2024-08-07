import type { EditorHost } from '@blocksuite/block-std';

import { BlockModel } from '@blocksuite/store';

import type { EdgelessSelectableProps } from '../../_common/edgeless/mixin/edgeless-selectable.js';
import type {
  IEdgelessElement,
  IHitTestOptions,
} from '../../surface-block/element-model/base.js';
import type { SurfaceBlockModel } from '../../surface-block/surface-model.js';
import type { IVec } from '../../surface-block/utils/vec.js';
import type { SerializedXYWH } from '../../surface-block/utils/xywh.js';

import { Bound } from '../../surface-block/utils/bound.js';
import {
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../../surface-block/utils/math-utils.js';
import { PointLocation } from '../../surface-block/utils/point-location.js';

export class EdgelessBlockModel<
    Props extends EdgelessSelectableProps = EdgelessSelectableProps,
  >
  extends BlockModel<Props>
  implements IEdgelessElement
{
  private _externalXYWH: SerializedXYWH | undefined = undefined;

  connectable = true;

  rotate = 0;

  boxSelect(bound: Bound): boolean {
    return (
      this.containedByBounds(bound) ||
      bound.points.some((point, i, points) =>
        this.intersectWithLine(point, points[(i + 1) % points.length])
      )
    );
  }

  containedByBounds(bounds: Bound): boolean {
    const bound = Bound.deserialize(this.xywh);
    const points = getPointsFromBoundsWithRotation({
      x: bound.x,
      y: bound.y,
      w: bound.w,
      h: bound.h,
      rotate: this.rotate,
    });
    return points.some(point => bounds.containsPoint(point));
  }

  getNearestPoint(point: IVec): IVec {
    const bound = Bound.deserialize(this.xywh);
    return polygonNearestPoint(
      rotatePoints(bound.points, bound.center, this.rotate ?? 0),
      point
    );
  }

  getRelativePointLocation(relativePoint: IVec): PointLocation {
    const bound = Bound.deserialize(this.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints(
      [point],
      bound.center,
      this.rotate ?? 0
    )[0];
    const points = rotatePoints(bound.points, bound.center, this.rotate ?? 0);
    const tangent = polygonGetPointTangent(points, rotatePoint);

    return new PointLocation(rotatePoint, tangent);
  }

  hitTest(x: number, y: number, _: IHitTestOptions, __: EditorHost): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }

  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);
    return linePolygonIntersects(
      start,
      end,
      rotatePoints(bound.points, bound.center, this.rotate ?? 0)
    );
  }

  get elementBound() {
    const bound = Bound.deserialize(this.xywh);
    return Bound.from(getBoundsWithRotation({ ...bound, rotate: this.rotate }));
  }

  get externalBound(): Bound | null {
    return this._externalXYWH ? Bound.deserialize(this._externalXYWH) : null;
  }

  get externalXYWH(): SerializedXYWH | undefined {
    return this._externalXYWH;
  }

  set externalXYWH(xywh: SerializedXYWH | undefined) {
    this._externalXYWH = xywh;
  }

  get group(): IEdgelessElement['group'] {
    const surfaceModel = this.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    return surfaceModel[0]?.getGroup(this.id) ?? null;
  }

  get groups() {
    const surfaceModel = this.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    return surfaceModel[0]?.getGroups(this.id) ?? [];
  }
}
