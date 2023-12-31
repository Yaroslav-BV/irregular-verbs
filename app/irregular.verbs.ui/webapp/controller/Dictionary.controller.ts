import BaseController from "./BaseController";
import Event from "sap/ui/base/Event";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ListBinding from "sap/ui/model/ListBinding";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Context from "sap/ui/model/odata/v4/Context";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import FilterType from "sap/ui/model/FilterType";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Message from "sap/ui/core/message/Message";
import SearchField from "sap/m/SearchField";
import Table from "sap/m/Table";
import { IDictionaryModel } from "../interfaces/dictionary.interfaces";
import {
	DICTIONARY_MODEL_NAME,
	SPEECH_MODEL_NAME,
	EMPTY_VERBS_DATA,
} from "../constants/dictionary.constant";
import { ISpeechModel, SpeechLang } from "../interfaces/speech.interface";
import { Button$PressEvent } from "sap/m/Button";

/**
 * @namespace irregular.verbs.ui.controller
 */
export default class Dictionary extends BaseController {
	private technicalErrors = false;

	async onInit(): Promise<void> {
		this.initDictionaryModel();
		this.initMessagesModel();
		await this.initSpeechModel();
	}

	/**
	 * Initialization message model
	 */
	initMessagesModel(): void {
		const messageManager = sap.ui.getCore().getMessageManager();
		const messageModel = messageManager.getMessageModel();
		const messageModelBinding = messageModel.bindList(
			"/",
			undefined,
			[],
			new Filter("technical", FilterOperator.EQ, true)
		);

		this.setModel(messageModel, "message");

		messageModelBinding.attachChange(this.onMessageBindingChange, this);
	}

	/**
	 * Initialization dictionary model
	 */
	private initDictionaryModel(): void {
		const initDictionary: IDictionaryModel = {
			busy: false,
			editable: false,
			hasUIChanges: false,
			verbsEmpty: true,
		};

		this.setModel(new JSONModel(initDictionary), DICTIONARY_MODEL_NAME);
	}

	/**
	 * Initialization speech model
	 */
	async initSpeechModel(): Promise<void> {
		const voices = await this.loadSpeechVoices(SpeechLang.EN);

		const initSpeechModel: ISpeechModel = {
			voices,
			selectedVoice: voices[0].name,
			speed: 1,
			pitch: 1,
		};

		this.setModel(new JSONModel(initSpeechModel), SPEECH_MODEL_NAME);
	}

	onEdit(): void {
		this.setPropDictionaryModel<boolean>("editable", true);
	}

	onCreate(): void {
		const binding = this.getDictionaryBinding();
		binding.create(EMPTY_VERBS_DATA);

		this.setUIChanges();
		this.setPropDictionaryModel<boolean>("verbsEmpty", true);
	}

	onSave(): void {
		const fnSuccess = () => {
			this.setBusy(false);
			MessageToast.show(this.getText("changesSentMessage"));
			this.setUIChanges(false);
		};

		const fnError = (error: Error) => {
			this.setBusy(false);
			this.setUIChanges(false);
			MessageBox.error(error.message);
		};

		this.setBusy(true);
		this.getModel<ODataModel>("dictionary")
			.submitBatch("dictionaryGroup")
			.then(fnSuccess, fnError);
		this.technicalErrors = false;

		this.setPropDictionaryModel<boolean>("editable", false);
	}

	onDelete(): void {
		const selected = (this.byId("dictionaryList") as Table).getSelectedItem();

		if (selected) {
			const context = selected.getBindingContext("dictionary") as Context;
			const verbId = context.getProperty("ID") as string;

			context.delete().then(
				() => {
					MessageToast.show(this.getText("deletionSuccessMessage"));
				},
				(error: Error) => {
					this.setUIChanges();
					MessageBox.error(error.message + ": " + verbId);
				}
			);

			this.setUIChanges(true);
		}
	}

	async onCancel(): Promise<void> {
		const binding = this.getDictionaryBinding();
		await binding.resetChanges();

		this.technicalErrors = false;
		this.setUIChanges();
		this.setPropDictionaryModel<boolean>("editable", false);
	}

	onSearch(): void {
		const searchField = this.byId("searchField") as SearchField;
		const searchValue = searchField.getValue();

		const filters = new Filter([
			new Filter("base", FilterOperator.Contains, searchValue),
			new Filter("past", FilterOperator.Contains, searchValue),
			new Filter("participle", FilterOperator.Contains, searchValue),
			new Filter("translation", FilterOperator.Contains, searchValue),
		]);

		const binding = this.getDictionaryBinding();
		binding.filter(filters, FilterType.Application);
	}

	onRefresh(): void {
		const binding = this.getDictionaryBinding();

		if (binding.hasPendingChanges()) {
			MessageBox.error(this.getText("refreshNotPossibleMessage"));
			return;
		}

		binding.refresh();

		MessageToast.show(this.getText("refreshSuccessMessage"));
	}

	/**
	 * Handle speech one verb
	 * @param {Button$ClickEvent} event Button click event object
	 */
	onSpeech(event: Button$PressEvent): void {
		const verb = event.getSource().getCustomData()[0].getValue() as string;

		this.runSpeech(verb);
	}

	onMessageBindingChange(event: Event): void {
		const contexts = event.getSource<ListBinding>().getContexts();
		let isMessageOpen = false;

		if (isMessageOpen || !contexts.length) return;

		const messages: Message[] = contexts.map<Message>(
			(context) => context.getObject() as Message
		);
		sap.ui.getCore().getMessageManager().removeMessages(messages);

		this.setUIChanges(true);
		this.technicalErrors = true;
		MessageBox.error(messages[0].getMessage(), {
			id: "serviceErrorMessageBox",
			onClose(): void {
				isMessageOpen = false;
			},
		});

		isMessageOpen = true;
	}

	private getText(textId: string): string {
		const resourceModel = this.getOwnerComponent().getModel(
			"i18n"
		) as ResourceModel;
		const resourceBundle = resourceModel.getResourceBundle() as ResourceBundle;

		return resourceBundle.getText(textId);
	}

	private setBusy(isBusy: boolean): void {
		this.setPropDictionaryModel<boolean>("busy", isBusy);
	}

	private setUIChanges(hasUIChanges?: boolean): void {
		if (this.technicalErrors) {
			hasUIChanges = true;
		} else if (hasUIChanges === undefined) {
			hasUIChanges = (
				this.getView().getModel("dictionary") as ODataModel
			).hasPendingChanges();
		}

		this.setPropDictionaryModel<boolean>("hasUIChanges", hasUIChanges);
	}

	private setPropDictionaryModel<T>(propName: string, value: T): void {
		const model = this.getModel<JSONModel>(DICTIONARY_MODEL_NAME);

		model.setProperty(`/${propName}`, value);
	}

	private getDictionaryBinding(): ODataListBinding {
		return this.byId("dictionaryList").getBinding("items") as ODataListBinding;
	}

	/**
	 * Load native voices
	 * @param {SpeechLang} speechLang Language
	 * @returns {Promise<SpeechSynthesisVoice[]>}
	 */
	private async loadSpeechVoices(
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

					return resolve(filteredVoices);
				}

				MessageToast.show(this.getText("loadVoicesFailedMessage"));
				return reject(new Error(this.getText("loadVoicesFailedMessage")));
			}, 10);
		});
	}

	/**
	 * Get Speech JSON Model
	 * @returns {ISpeechModel}
	 */
	getDictionaryStore(): ISpeechModel {
		const speechModel = this.getModel<JSONModel>(SPEECH_MODEL_NAME);

		return speechModel.getData() as ISpeechModel;
	}

	/**
	 * Run speach
	 * @param {string} phrase Phrase for speech
	 */
	private runSpeech(phrase: string): void {
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
}
