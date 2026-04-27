declare module "seeso/easy-seeso" {
  export default class EasySeeSo {
    init(
      licenseKey: string,
      onSuccess:  () => void | Promise<void>,
      onError:    () => void
    ): Promise<void>;
    startTracking(
      onGaze:  (g: { x: number; y: number }) => void,
      onDebug: (fps: number) => void
    ): Promise<void>;
    stopTracking():    void;
    startCalibration(
      onNext:     (x: number, y: number) => void,
      onProgress: (progress: number) => void,
      onFinished: () => void
    ): void;
    startCollectSamples(): void;
    setMonitorSize(inches: number):                        void;
    setFaceDistance(cm: number):                          void;
    setCameraPosition(x: number, cameraOnTop: boolean):   void;
    showImage(): void;
    hideImage(): void;
  }
}
