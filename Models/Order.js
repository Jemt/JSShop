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
		Message: "",						// string
		AltCompany: "",						// string
		AltFirstName: "",					// string
		AltLastName: "",					// string
		AltAddress: "",						// string
		AltZipCode: "",						// string
		AltCity: "",						// string
		Price: 0,							// number
		Vat: 0,								// number
		Currency: "",						// string
		Weight: 0,							// number
		WeightUnit: "",						// string
		ShippingExpense: 0,					// number
		ShippingVat: 0,						// number
		ShippingMessage: "",				// string
		PaymentMethod: "",					// string
		TransactionId: "",					// string
		State: ""							// string
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

	this.CalculateShippingExpense = function()
	{
		return JSShop.Models.Order.CalculateShippingExpense(me.Price(), me.Vat(), me.Currency(), me.Weight(), me.WeightUnit());
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
JSShop.Models.Order.CalculateShippingExpense = function(price, vat, currency, weight, weightUnit)
{
	Fit.Validation.ExpectNumber(price);
	Fit.Validation.ExpectNumber(vat);
	Fit.Validation.ExpectString(currency);
	Fit.Validation.ExpectNumber(weight);
	Fit.Validation.ExpectString(weightUnit);

	var ex = JSShop.Settings.ShippingExpenseExpression;

	if (ex === null || ex === "")
		return 0.0;

	// Security validation

	ex = ex.replace(/ |[0-9]|\*|\+|\-|\/|=|&|\||!|\.|:|\(|\)|>|<|\?|true|false/g, ""); // Allow various math/comparison/logical operations
	ex = ex.replace(/price|vat|currency|weight|weightunit/g, ""); // Allow use of predefined variables

	if (ex !== "") // All valid elements were removed above, so if ex contains anything, it is potentially a security threat
		throw "InvalidShippingExpenseExpression: Invalid and potentially insecure ShippingExpenseExpression detected - evaluation aborted";

	// Add data to expression

	var expr = "";
	expr += "var price = " + price + ";";
	expr += "var vat = " + vat + ";";
	expr += "var currency = \"" + currency + "\";";
	expr += "var weight = " + weight + ";";
	expr += "var weightunit = \"" + weightUnit + "\";";
	expr += "(" + JSShop.Settings.ShippingExpenseExpression + ");";

	// Evaluate, validate, and return

	var expense = eval(expr); // May throw error on invalid expression

	var isNumber = /^\-?([0-9]+(\.[0-9]+)?)$/.test(expense.toString()); // Both positive and negative values are allowed

	if (isNumber === false || typeof(expense) !== "number")
		throw "NotNumber: Shipping Expense Expression did not produce a valid value (number)";

	return expense;
}
