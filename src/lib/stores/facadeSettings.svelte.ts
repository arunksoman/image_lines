/**
 * Facade Settings Store — Reactive state for the facade panel layout page.
 * Uses Svelte 5 runes ($state) for fine-grained reactivity.
 */

export interface PanelTypeWeights {
	A: number; // 0–100 proportion
	B: number;
	C: number;
}

export interface FacadeSettings {
	// Model
	modelLoaded: boolean;
	modelName: string;

	// Plane selection
	selectedPlaneCount: number;
	selectionMode: boolean;

	// Panel type weights (0–100 each, controls random distribution)
	panelTypeWeights: PanelTypeWeights;

	// Panel dimensions (mm)
	panelWidth: number;
	panelHeight: number;
	panelThickness: number;

	// Perforation
	perforationDensity: number;  // 0–1
	holeSize: number;            // mm
	patternScale: number;        // multiplier

	// Material
	materialPreset: 'steel' | 'aluminium' | 'titanium' | 'bronze';
}

export const defaultFacadeSettings: FacadeSettings = {
	modelLoaded: false,
	modelName: '',

	selectedPlaneCount: 0,
	selectionMode: false,

	panelTypeWeights: { A: 100, B: 0, C: 0 },

	panelWidth: 1000,
	panelHeight: 1000,
	panelThickness: 3,

	perforationDensity: 0.4,
	holeSize: 8,
	patternScale: 1.0,

	materialPreset: 'steel',
};

/**
 * Creates a reactive facade settings state using Svelte 5 runes.
 */
export function createFacadeSettings() {
	let settings = $state<FacadeSettings>({ ...defaultFacadeSettings });

	return {
		get value() { return settings; },
		set value(v: FacadeSettings) { settings = v; },
		update(partial: Partial<FacadeSettings>) {
			settings = { ...settings, ...partial };
		},
		reset() {
			settings = { ...defaultFacadeSettings };
		}
	};
}
