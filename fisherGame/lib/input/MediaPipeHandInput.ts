import { GameInput, NormalizedPoint } from "./GameInput";

/**
 * MediaPipe hand-tracking input: uses handPosRef for cursor and isFistRef for click/pinch.
 */
export class MediaPipeHandInput implements GameInput {
  private handPosRef: React.MutableRefObject<{ x: number; y: number }>;
  private isFistRef: React.MutableRefObject<boolean>;

  private wasFist: boolean = false;
  private currentFist: boolean = false;

  constructor(
    handPosRef: React.MutableRefObject<{ x: number; y: number }>,
    isFistRef: React.MutableRefObject<boolean>
  ) {
    this.handPosRef = handPosRef;
    this.isFistRef = isFistRef;
  }

  update(): void {
    // Actualizar el estado del puño
    this.wasFist = this.currentFist;
    this.currentFist = this.isFistRef.current;
  }

  getHandPosition(): NormalizedPoint {
    return {
      x: this.handPosRef.current.x,
      y: this.handPosRef.current.y
    };
  }

  isPinching(): boolean {
    // Puño cerrado = pinching
    return this.currentFist;
  }

  isPinchStart(): boolean {
    // Rising edge: puño se acaba de cerrar
    return this.currentFist && !this.wasFist;
  }

  isPinchEnd(): boolean {
    // Falling edge: puño se acaba de abrir
    return !this.currentFist && this.wasFist;
  }

  isGrabbing(): boolean {
    // No hay gesto de dos manos en este input
    return false;
  }

  dispose(): void {
    // No hay recursos que liberar
  }
}
