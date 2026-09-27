/** Yaw of a chassis whose local forward axis is -Z. */
export function headingFromRotation(rot: { x: number; y: number; z: number; w: number }): number {
  return Math.atan2(
    2 * (rot.w * rot.y + rot.x * rot.z),
    1 - 2 * (rot.y * rot.y + rot.z * rot.z),
  );
}