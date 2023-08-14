import BaseController from "./BaseController";
import Event from "sap/ui/base/Event";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ListBinding from "sap/ui/model/ListBinding";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import FilterType from "sap/ui/model/FilterType";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Message from "sap/ui/core/message/Message";
import SearchField from "sap/m/SearchField";
import { IDictionaryStore } from "../interfaces/dictionary.interfaces";
import { DICTIONARY_STORE_NAME } from "../constants/dictionary.constant";

/**
 * @namespace irregular.verbs.ui.controller
 */
export default class Dictionary extends BaseController {
	private technicalErrors = false;

	onInit(): void {
		this.initDictionaryStore();
		this.initMessages();
	}

	initMessages(): void {
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

	private setUIChanges(hasUIChanges: boolean): void {
		if (this.technicalErrors) {
			hasUIChanges = true;
		} else if (hasUIChanges === undefined) {
			hasUIChanges = (
				this.getView().getModel("dictionary") as ODataModel
			).hasPendingChanges();
		}

		const model = this.getView().getModel(DICTIONARY_STORE_NAME) as JSONModel;
		model.setProperty("/hasUIChanges", hasUIChanges);
	}

	/**
	 * Initialization dictionary store
	 */
	private initDictionaryStore(): void {
		const initDictionaryStore: IDictionaryStore = {
			busy: false,
			editable: false,
			hasUIChanges: false,
		};

		const dictionaryStore = new JSONModel(initDictionaryStore);

		this.setModel(dictionaryStore, DICTIONARY_STORE_NAME);
	}

	onEdit(): void {
		(this.getModel(DICTIONARY_STORE_NAME) as JSONModel).setProperty(
			"/editable",
			true
		);
	}

	onCancel(): void {
		(this.getModel(DICTIONARY_STORE_NAME) as JSONModel).setProperty(
			"/editable",
			false
		);
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

		const tableBinding = this.byId("dictionaryList").getBinding(
			"items"
		) as ODataListBinding;

		tableBinding.filter(filters, FilterType.Application);
	}

	onRefresh(): void {
		const binding = this.byId("dictionaryList").getBinding(
			"items"
		) as ODataListBinding;

		if (binding.hasPendingChanges()) {
			MessageBox.error(this.getText("refreshNotPossibleMessage"));
			return;
		}

		binding.refresh();

		MessageToast.show(this.getText("refreshSuccessMessage"));
	}

	private getText(textId: string): string {
		const resourceModel = this.getOwnerComponent().getModel(
			"i18n"
		) as ResourceModel;
		const resourceBundle = resourceModel.getResourceBundle() as ResourceBundle;

		return resourceBundle.getText(textId);
	}
}
