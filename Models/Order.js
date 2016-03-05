if (!window.JSShop)
	Fit.Validation.ThrowError("JSShop.js must be loaded");

JSShop.Models.Order = function(orderId)
{
	Fit.Validation.ExpectStringValue(orderId);
	Fit.Core.Extend(this, JSShop.Models.Base).Apply(orderId);

	var me = this;

	var properties =
	{
		Id: orderId,						// string
		//State: "",						// string
		Time: -1,							// number
		ClientIp: "",						// string
		Company: "",						// string
		FirstName: "",						// string
		LastName: "",						// string
		Address: "",						// string
		ZipCode: "",						// string
		City: "",							// string
		Email: "",							// string
		Phone: "",							// string
		AltCompany: "",						// string
		AltFirstName: "",					// string
		AltLastName: "",					// string
		AltAddress: "",						// string
		AltZipCode: 0,						// number
		AltCity: "",						// string
		Price: 0,							// number
		Vat: 0,								// number
		//PaymentType: "",					// string
		//TransactionId: ""					// string
	};

	function init()
	{
		me.InitializeModel();
	}

	this.GetModelName = function()
	{
		return "Order";
	}

	this.GetProperties = function()
	{
		return properties;
	}

	this.GetWebServiceUrls = function()
	{
		urls =
		{
			Create: JSShop.WebService.Orders.Create,
			Retrieve: JSShop.WebService.Orders.Retrieve,
			RetrieveAll: JSShop.WebService.Orders.RetrieveAll,
			Update: JSShop.WebService.Orders.Update,
			Delete: JSShop.WebService.Orders.Delete
		}

		return urls;
	}

	init();
}
JSShop.Models.Order.RetrieveAll = function(fromTimestamp, toTimestamp, cbSuccess, cbFailure)
{
	Fit.Validation.ExpectInteger(fromTimestamp);
	Fit.Validation.ExpectInteger(toTimestamp);
	Fit.Validation.ExpectFunction(cbSuccess);
	Fit.Validation.ExpectFunction(cbFailure, true);

	var match = [];
	Fit.Array.Add(match, { Field: "Time", Operator: ">=", Value: fromTimestamp });
	Fit.Array.Add(match, { Field: "Time", Operator: "<=", Value: toTimestamp });

	JSShop.Models.Base.RetrieveAll(JSShop.Models.Order, "Id", match, cbSuccess, cbFailure);
}
