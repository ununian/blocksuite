import { type IVec, Vec } from './vec.js';

export class PointLocation extends Array<number> implements IVec {
  _in: IVec = [0, 0];

  _out: IVec = [0, 0];

  // the tangent belongs to the point on the element outline
  _tangent: IVec = [0, 0];

  constructor(
    point: IVec = [0, 0],
    tangent: IVec = [0, 0],
    inVec: IVec = [0, 0],
    outVec: IVec = [0, 0]
  ) {
    super(2);
    this[0] = point[0];
    this[1] = point[1];
    this._tangent = tangent;
    this._in = inVec;
    this._out = outVec;
  }

  static fromVec(vec: IVec) {
    const point = new PointLocation();
    point[0] = vec[0];
    point[1] = vec[1];
    return point;
  }

  clone() {
    return new PointLocation(this, this._tangent, this._in, this._out);
  }

  setVec(vec: IVec) {
    this[0] = vec[0];
    this[1] = vec[1];
    return this;
  }

  toVec(): IVec {
    return [this[0], this[1]];
  }

  get absIn() {
    return Vec.add(this, this._in);
  }

  get absOut() {
    return Vec.add(this, this._out);
  }

  get in() {
    return this._in;
  }

  set in(value: IVec) {
    this._in = value;
  }

  get out() {
    return this._out;
  }

  set out(value: IVec) {
    this._out = value;
  }

  get tangent() {
    return this._tangent;
  }

  set tangent(value: IVec) {
    this._tangent = value;
  }
}
