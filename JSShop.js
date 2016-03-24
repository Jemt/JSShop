if (!window.Fit)
	throw "Fit.UI must be loaded for JSShop to work";

// ======================================================
// Namespaces
// ======================================================

JSShop = {};
JSShop._internal = {};

// Settings

JSShop.Settings = {};
JSShop.Settings.ShippingExpenseExpression = null;
JSShop.Settings.ShippingExpenseVat = 0;
JSShop.Settings.ShippingExpenseMessage = null;
JSShop.Settings.BasketUrl = null;

// Language

JSShop.Language = {};
JSShop.Language.Name = "en";
JSShop.Language.Translations = {};

// Models, Presenters, and Cookies

JSShop.Models = {};
JSShop.Presenters = {};

JSShop.Cookies = new Fit.Cookies();
JSShop.Cookies.Prefix("JSShop");

// Communication

JSShop.WebService = {};
JSShop.WebService.Products = {};
JSShop.WebService.Products.Create = null;
JSShop.WebService.Products.Retrieve = null;
JSShop.WebService.Products.Update = null;
JSShop.WebService.Products.Delete = null;
JSShop.WebService.Files = {};
JSShop.WebService.Files.Upload = null;
JSShop.WebService.Files.Remove = null;
JSShop.WebService.Orders = {};
JSShop.WebService.Orders.Create = null;
JSShop.WebService.Orders.Retrieve = null;
JSShop.WebService.Orders.Update = null;
JSShop.WebService.Orders.Delete = null;
JSShop.WebService.OrderEntries = {};
JSShop.WebService.OrderEntries.Create = null;
JSShop.WebService.OrderEntries.Retrieve = null;
JSShop.WebService.OrderEntries.Update = null;
JSShop.WebService.OrderEntries.Delete = null;

// ======================================================
// Cross model event handlers
// ======================================================

// Callback signatures: function(request, model[], operationType).
// Called when models interact with backend.

JSShop.Events = {};
JSShop.Events.OnRequest = null;
JSShop.Events.OnSuccess = null;
JSShop.Events.OnError = null;

// ======================================================
// JSShop path info
// ======================================================

// Determine path information

(function()
{
	// Find Base URL - e.g. http://server.com/libs/jsshop
	var src = document.scripts[document.scripts.length - 1].src;
	JSShop._internal.BaseUrl = src.substring(0, src.lastIndexOf("/"));

	// Calculate Base Path - e.g. /libs/jsshop
	var path = JSShop._internal.BaseUrl.replace("http://", "").replace("https://", "");
	JSShop._internal.BasePath = path.substring(path.indexOf("/"));
})();

JSShop.GetUrl = function()
{
	return JSShop._internal.BaseUrl;
}

JSShop.GetPath = function()
{
	return JSShop._internal.BasePath;
}

// ======================================================
// JSShop loader
// ======================================================

JSShop.Initialize = function(cb)
{
	Fit.Validation.ExpectFunction(cb);

	Fit.Loader.LoadScripts(
	[
		// Load language
		{ source: JSShop.GetPath() + "/Languages/" + JSShop.Language.Name.toLowerCase() + ".js" },

		// Load models
		{ source: JSShop.GetPath() + "/Models/Base.js" },
		{ source: JSShop.GetPath() + "/Models/Product.js" },
		{ source: JSShop.GetPath() + "/Models/Basket.js" },
		{ source: JSShop.GetPath() + "/Models/Order.js" },
		{ source: JSShop.GetPath() + "/Models/OrderEntry.js" },

		// Load presenters
		{ source: JSShop.GetPath() + "/Presenters/ProductForm.js" },
		{ source: JSShop.GetPath() + "/Presenters/ProductList.js" },
		{ source: JSShop.GetPath() + "/Presenters/Basket.js" }
	],
	function(cfgs)
	{
		cb();
	});
}
