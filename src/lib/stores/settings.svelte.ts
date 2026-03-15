/**
 * Settings Store — Reactive state management for all panel parameters
 * Uses Svelte 5 runes ($state) for fine-grained reactivity.
 */

export interface PanelSettings {
	// Image
	imageData: ImageData | null;
	imageName: string;

	// Line field
	lineDensity: number;       // spacing between lines (px in working resolution)
	lineCurvature: number;     // how much lines curve (0-1)
	noiseAmount: number;       // noise displacement strength
	noiseScale: number;        // noise frequency
	flowDirection: number;     // angle in degrees

	// Perforation
	slotMinWidth: number;      // minimum slot width (mm)
	slotMaxWidth: number;      // maximum slot width (mm)
	slotLength: number;        // slot length (mm)
	slotSpacing: number;       // spacing between slots along line (mm)

	// Panel
	panelWidth: number;        // mm
	panelHeight: number;       // mm
	panelThickness: number;    // mm

	// Visual mode
	visualMode: 'day' | 'daylight' | 'night' | 'distance';

	// Working resolution
	workingResolution: number;
}

export const defaultSettings: PanelSettings = {
	imageData: null,
	imageName: '',

	lineDensity: 8,
	lineCurvature: 0.3,
	noiseAmount: 0.2,
	noiseScale: 0.01,
	flowDirection: 0,

	slotMinWidth: 2,
	slotMaxWidth: 15,
	slotLength: 20,
	slotSpacing: 4,

	panelWidth: 2000,
	panelHeight: 1000,
	panelThickness: 3,

	visualMode: 'day',
	workingResolution: 512,
};

/**
 * Creates a reactive settings state using Svelte 5 runes.
 * Call this at the top level of a component to get reactive state.
 */
export function createSettings() {
	let settings = $state<PanelSettings>({ ...defaultSettings });

	return {
		get value() { return settings; },
		set value(v: PanelSettings) { settings = v; },
		update(partial: Partial<PanelSettings>) {
			settings = { ...settings, ...partial };
		},
		reset() {
			const img = settings.imageData;
			const name = settings.imageName;
			settings = { ...defaultSettings, imageData: img, imageName: name };
		}
	};
}
