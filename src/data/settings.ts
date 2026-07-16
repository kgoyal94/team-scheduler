// TODO(Phase 2 / Kuhuk): replace with Supabase
import { Settings } from "../domain/types";
import { defaultSettings } from "./seed";

let _settings: Settings = { ...defaultSettings };

export function loadSettings(): Settings {
  return _settings;
}

export function saveSettings(settings: Settings): void {
  _settings = settings;
}
