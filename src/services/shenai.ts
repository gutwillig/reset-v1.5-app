import {
  initialize,
  deinitialize,
  getMeasurementResults,
  getMeasurementState,
  getMeasurementProgressPercentage,
  getFaceState as sdkGetFaceState,
  getHeartRate4s,
  setOperatingMode,
  setCameraMode,
  OperatingMode,
  MeasurementPreset,
  PrecisionMode,
  OnboardingMode,
  CameraMode,
  FaceState as SdkFaceState,
  MeasurementState as SdkMeasurementState,
  type MeasurementResults,
} from "react-native-shenai-sdk";

export interface ScanResults {
  heartRate: number;
  stressIndex: number | null;
  hrvSdnn: number | null;
  hrvLnrmssd: number | null;
  breathingRate: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  parasympatheticActivity: number | null;
  cardiacWorkload: number | null;
  ageEstimate: number | null;
  signalQuality: number;
}

export type FaceState =
  | "OK"
  | "NOT_CENTERED"
  | "TOO_CLOSE"
  | "TOO_FAR"
  | "NOT_VISIBLE";

export type MeasurementState =
  | "NOT_STARTED"
  | "WAITING_FOR_FACE"
  | "RUNNING"
  | "FINISHED"
  | "FAILED";

function r1(v: number | null | undefined): number | null {
  return v != null ? Math.round(v) : null;
}

export function mapSdkResults(raw: MeasurementResults): ScanResults {
  return {
    heartRate: Math.round(raw.heartRateBpm),
    stressIndex: r1(raw.stressIndex),
    hrvSdnn: r1(raw.hrvSdnnMs),
    hrvLnrmssd: r1(raw.hrvLnrmssdMs),
    breathingRate: r1(raw.breathingRateBpm),
    systolicBP: r1(raw.systolicBloodPressureMmhg),
    diastolicBP: r1(raw.diastolicBloodPressureMmhg),
    parasympatheticActivity: r1(raw.parasympatheticActivity),
    cardiacWorkload: r1(raw.cardiacWorkloadMmhgPerSec),
    ageEstimate: r1(raw.ageYears),
    signalQuality: raw.averageSignalQuality,
  };
}

export async function initShenAI(apiKey: string): Promise<void> {
  const result = await initialize(apiKey, undefined, {
    measurementPreset: MeasurementPreset.THIRTY_SECONDS_ALL_METRICS,
    precisionMode: PrecisionMode.RELAXED,
    cameraMode: CameraMode.FACING_USER,
    showUserInterface: true,
    showFacePositioningOverlay: true,
    showVisualWarnings: false,
    showFaceMask: false,
    showBloodFlow: false,
    showStartStopButton: false,
    showInfoButton: false,
    hideShenaiLogo: true,
    enableSummaryScreen: false,
    showResultsFinishButton: false,
    showSignalQualityIndicator: false,
    showSignalTile: false,
    showOutOfRangeResultIndicators: false,
    showTrialMetricLabels: false,
    enableMeasurementsDashboard: false,
    showDisclaimer: false,
    onboardingMode: OnboardingMode.HIDDEN,
    operatingMode: OperatingMode.POSITIONING,
  });

  // InitializationResult.OK === 0
  if (result !== 0) {
    throw new Error(`Shen AI init failed: code ${result}`);
  }
}

// In v2.11.6, measurement starts automatically when in MEASURE mode and face is detected
export async function startScan(): Promise<void> {
  await setOperatingMode(OperatingMode.MEASURE);
}

export async function stopScan(): Promise<void> {
  await setOperatingMode(OperatingMode.POSITIONING);
}

export async function shutdownShenAI(): Promise<void> {
  try {
    await deinitialize();
  } catch {
    // Best effort cleanup
  }
}

export async function getScanResults(): Promise<ScanResults | null> {
  const raw = await getMeasurementResults();
  if (!raw) return null;
  return mapSdkResults(raw);
}

const FACE_STATE_MAP: Record<number, FaceState> = {
  [SdkFaceState.OK]: "OK",
  [SdkFaceState.TOO_FAR]: "TOO_FAR",
  [SdkFaceState.TOO_CLOSE]: "TOO_CLOSE",
  [SdkFaceState.NOT_CENTERED]: "NOT_CENTERED",
  [SdkFaceState.NOT_VISIBLE]: "NOT_VISIBLE",
};

export async function getFaceStateValue(): Promise<FaceState> {
  const state = await sdkGetFaceState();
  return FACE_STATE_MAP[state] ?? "NOT_VISIBLE";
}

// In v2.11.6, readiness is determined by face state being OK
export async function isReady(): Promise<boolean> {
  const face = await sdkGetFaceState();
  return face === SdkFaceState.OK;
}

export async function getRealtimeHeartRate(): Promise<number | null> {
  return getHeartRate4s();
}

const MEASUREMENT_STATE_MAP: Record<number, MeasurementState> = {
  [SdkMeasurementState.NOT_STARTED]: "NOT_STARTED",
  [SdkMeasurementState.WAITING_FOR_FACE]: "WAITING_FOR_FACE",
  [SdkMeasurementState.RUNNING_SIGNAL_SHORT]: "RUNNING",
  [SdkMeasurementState.RUNNING_SIGNAL_GOOD]: "RUNNING",
  [SdkMeasurementState.RUNNING_SIGNAL_BAD]: "RUNNING",
  [SdkMeasurementState.RUNNING_SIGNAL_BAD_DEVICE_UNSTABLE]: "RUNNING",
  [SdkMeasurementState.FINISHED]: "FINISHED",
  [SdkMeasurementState.FAILED]: "FAILED",
};

export async function getMeasureState(): Promise<MeasurementState> {
  const state = await getMeasurementState();
  return MEASUREMENT_STATE_MAP[state] ?? "NOT_STARTED";
}

export async function getMeasureProgress(): Promise<number> {
  return getMeasurementProgressPercentage();
}

export async function getViolatedCondition(): Promise<number | null> {
  return null;
}
