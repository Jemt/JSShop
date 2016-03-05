if (!window.JSShop)
	Fit.Validation.ThrowError("JSShop.js must be loaded");

JSShop.Models.Product = function(itemId)
{
	Fit.Validation.ExpectStringValue(itemId);
	Fit.Core.Extend(this, JSShop.Models.Base).Apply(itemId);

	var me = this;

	var properties =
	{
		Id: itemId,				// string
		Category: "",			// string
		Title: "",				// string
		Description: "",		// string
		Images: "",				// string
		Price: 0,				// number
		Currency: "",			// string
		Vat: 0,					// number
		Weight: 0,				// number
		WeightUnit: "",			// string
		DeliveryTime: "",		// string
		DiscountExpression: "",	// string
		DiscountMessage: ""		// string
	};

	function init()
	{
		me.InitializeModel();
	}

	this.GetModelName = function()
	{
		return "Product";
	}

	this.GetProperties = function()
	{
		return properties;
	}

	this.GetWebServiceUrls = function()
	{
		urls =
		{
			Create: JSShop.WebService.Products.Create,
			Retrieve: JSShop.WebService.Products.Retrieve,
			RetrieveAll: JSShop.WebService.Products.RetrieveAll,
			Update: JSShop.WebService.Products.Update,
			Delete: JSShop.WebService.Products.Delete
		}

		return urls;
	}

	this.CalculateDiscount = function(units)
	{
		Fit.Validation.ExpectInteger(units);

		/* Example - how to use it:
		x = new JSShop.Models.Product("10001");
		x.Retrieve(function(model)
		{
			x.DiscountExpression("(units >= 3 ? price : 0)"); // Buy 3+, get one for free
			x.DiscountExpression("(units >= 10 ? units * price * 0.20 : " + x.DiscountExpression() + ")"); // Buy 10+ to get 20% discount, otherwise use rule above

			console.log("Discount", x.CalculateDiscount(15));
		}); */

		var ex = me.DiscountExpression();

		if (ex === "")
			return 0.0;

		// Security validation

		//ex = ex.replace(/Math\.[a-z]+/gi, ""); // Allow Math function calls (disabled - most likely not supported natively on backend)
		ex = ex.replace(/ |[0-9]|\*|\+|\-|\/|=|&|\||!|\.|:|\(|\)|>|<|\?|true|false/g, ""); // Allow various math/comparison/logical operations
		ex = ex.replace(/units|price|vat|currency|weight|weightunit/g, ""); // Allow use of predefined variables

		if (ex !== "") // All valid elements were removed above, so if ex contains anything, it is potentially a security threat
			throw "InvalidDiscountExpression: Invalid and potentially insecure DiscountExpression detected - evaluation aborted";

		// Add data to expression

		var expr = "";
		expr += "var units = " + units + ";";
		expr += "var price = " + me.Price() + ";";
		expr += "var vat = " + me.Vat() + ";";
		expr += "var currency = \"" + me.Currency() + "\";";
		expr += "var weight = \"" + me.Weight() + "\";";
		expr += "var weightunit = \"" + me.WeightUnit() + "\";";
		expr += "(" + me.DiscountExpression() + ");";

		// Evaluate, validate, and return

		var discount = eval(expr); // May throw error on invalid expression

		var isNumber = /^\-?([0-9]+(\.[0-9]+)?)$/.test(discount.toString()); // Both positive and negative values are allowed

		if (isNumber === false || typeof(discount) !== "number")
			throw "NotNumber: Discount expression did not produce a valid value (number)";

		return discount;
	}

	init();
}
JSShop.Models.Product.RetrieveAll = function(category, cbSuccess, cbFailure)
{
	Fit.Validation.ExpectString(category);
	Fit.Validation.ExpectFunction(cbSuccess);
	Fit.Validation.ExpectFunction(cbFailure, true);

	var match = ((category !== "") ? [{ Field: "Category", Operator: "=", Value: category }] : []);
	JSShop.Models.Base.RetrieveAll(JSShop.Models.Product, "Id", match, cbSuccess, cbFailure);
}
