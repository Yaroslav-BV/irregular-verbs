declare module "sap/ui/model/Model" {
	export class CustomModel extends Model {
		getData: <T>() => T;
	}
}

declare module "sap/ui/model/ContextBinding" {
	export class CustomContextBinding extends ContextBinding {
		requestObject: <T>() => Promise<T>;
	}
}
