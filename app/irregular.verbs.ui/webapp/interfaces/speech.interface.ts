export interface ISpeechModel {
	voices: SpeechSynthesisVoice[];
	selectedVoice: string;
	speed: number;
	pitch: number;
}

export enum SpeechLang {
	EN = "en",
	DE = "de",
}
