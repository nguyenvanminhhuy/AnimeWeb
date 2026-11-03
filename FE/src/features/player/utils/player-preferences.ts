export interface PlayerPreferences {
  volume: number;
  muted: boolean;
  rate: number;
  subtitle: string;
}
const defaults: PlayerPreferences = { volume: 1, muted: false, rate: 1, subtitle: 'default' };
const key = 'aw:player:preferences:v1';
export function readPlayerPreferences(): PlayerPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return {
      volume:
        typeof value?.volume === 'number' && value.volume >= 0 && value.volume <= 1
          ? value.volume
          : 1,
      muted: value?.muted === true,
      rate: [0.5, 0.75, 1, 1.25, 1.5, 2].includes(value?.rate) ? value.rate : 1,
      subtitle:
        typeof value?.subtitle === 'string' && value.subtitle.length <= 100
          ? value.subtitle
          : 'default',
    };
  } catch {
    return { ...defaults };
  }
}
export function writePlayerPreferences(value: PlayerPreferences) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Playback remains usable without storage. */
  }
}
