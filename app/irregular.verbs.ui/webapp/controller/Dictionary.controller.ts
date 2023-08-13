import { CustomModel } from "sap/ui/model/Model";
import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Button$ClickEvent } from "sap/ui/webc/main/Button";
import { CustomContextBinding } from "sap/ui/model/ContextBinding";

interface IDictionaryStore {
	voices: SpeechSynthesisVoice[];
	selectedVoice: string;
	speed: number;
	pitch: number;
}

interface DictionaryRow {
	ID: string;
	base: string;
	past: string;
	participle: string;
	translation: string;
}

enum SpeechLang {
	EN = "en",
	DE = "de",
}

/**
 * @namespace irregular.verbs.ui.controller
 */
export default class Dictionary extends BaseController {
	private readonly storeName = "dictionaryStoreModel";

	async onInit(): Promise<void> {
		const voices = await this.loadSpeechVoices(SpeechLang.EN);

		const dictionaryStore: IDictionaryStore = {
			voices,
			selectedVoice: voices[0].name,
			speed: 1,
			pitch: 1,
		};

		const dictionaryStoreModel = new JSONModel(dictionaryStore);
		this.getView().setModel(dictionaryStoreModel, this.storeName);
	}

	/**
	 * Load native voices
	 * @param {SpeechLang} speechLang Language
	 * @returns {Promise<SpeechSynthesisVoice[]>}
	 */
	async loadSpeechVoices(
		speechLang: SpeechLang
	): Promise<SpeechSynthesisVoice[]> {
		return new Promise((resolve, reject) => {
			const synth: SpeechSynthesis = window.speechSynthesis;

			const intervalId = setInterval(() => {
				const voices = synth.getVoices();

				if (voices.length) {
					clearInterval(intervalId);

					const langRegExp = new RegExp(speechLang);
					const filteredVoices = voices
						.filter((voice) => langRegExp.test(voice.lang))
						.sort((a, b) => a.name.localeCompare(b.name));

					resolve(filteredVoices);
				}

				reject(new Error(`Load synth voices failed`));
			}, 10);
		});
	}

	/**
	 * Get Dictionary JSON Model
	 * @returns {IDictionaryStore}
	 */
	getDictionaryStore(): IDictionaryStore {
		const model = this.getView().getModel(this.storeName) as CustomModel;

		return model.getData<IDictionaryStore>();
	}

	/**
	 * Run speach
	 * @param {string} phrase Phrase for speech
	 */
	runSpeech(phrase: string): void {
		const synth: SpeechSynthesis = window.speechSynthesis;

		synth.cancel();

		const { voices, selectedVoice, speed, pitch } = this.getDictionaryStore();
		const voice = voices.find((voice) => voice.name === selectedVoice);

		const utterThis = new SpeechSynthesisUtterance(phrase);
		utterThis.voice = voice;
		utterThis.rate = speed;
		utterThis.pitch = pitch;

		synth.speak(utterThis);
	}

	/**
	 * Say all phrase
	 * @param {Button$ClickEvent} event Button click event object
	 */
	async onSayAllPhrase(event: Button$ClickEvent): Promise<void> {
		const id = event.getSource().getCustomData()[0].getValue() as string;

		const context = this.getModel("dictionary").bindContext(
			`/Dictionary/${id}`
		) as CustomContextBinding;

		const { base, past, participle } =
			await context.requestObject<DictionaryRow>();

		const phrase = `${base}, ${past}, ${participle}`;

		this.runSpeech(phrase);
	}

	/**
	 * Say word
	 * @param {Button$ClickEvent} event Button click event object
	 */
	onSayWord(event: Button$ClickEvent): void {
		const phrase = event.getSource().getCustomData()[0].getValue() as string;

		this.runSpeech(phrase);
	}
}
