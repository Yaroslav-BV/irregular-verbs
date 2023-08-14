import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import FilterType from "sap/ui/model/FilterType";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import SearchField from "sap/m/SearchField";
import { IDictionaryStore } from "../interfaces/dictionary.interfaces";
import { DICTIONARY_STORE_NAME } from "../constants/dictionary.constant";

/**
 * @namespace irregular.verbs.ui.controller
 */
export default class Dictionary extends BaseController {
	onInit(): void {
		this.initDictionaryStore();
	}

	/**
	 * Initialization dictionary store
	 */
	private initDictionaryStore(): void {
		const initDictionaryStore: IDictionaryStore = {
			busy: false,
			editable: false,
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
