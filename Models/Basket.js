if (!window.JSShop)
	Fit.Validation.ThrowError("JSShop.js must be loaded");

JSShop.Models.Basket = {};

JSShop.Models.Basket.Add = function(productId, units)
{
	Fit.Validation.ExpectStringValue(productId);
	Fit.Validation.ExpectInteger(units);

	if (units < 1)
		return;

	var basketData = Fit.Cookies.Get("JSShopBasket");
	var basket = ((basketData !== null) ? JSON.parse(basketData) : { Items: [] });

	var alreadyAdded = false;

	Fit.Array.ForEach(basket.Items, function(item)
	{
		if (item.ProductId === productId)
		{
			alreadyAdded = true;
			item.Units = item.Units + units;

			return false; // Break loop
		}
	});

	if (alreadyAdded === false)
	{
		var item = { ProductId: productId, Units: units };
		Fit.Array.Add(basket.Items, item);
	}

	Fit.Cookies.Set("JSShopBasket", JSON.stringify(basket)); // Session cookie
}

JSShop.Models.Basket.Update = function(productId, units)
{
	Fit.Validation.ExpectStringValue(productId);
	Fit.Validation.ExpectInteger(units);

	if (units < 1)
	{
		JSShop.Models.Basket.Remove(productId);
		return;
	}

	var basketData = Fit.Cookies.Get("JSShopBasket");
	var basket = ((basketData !== null) ? JSON.parse(basketData) : { Items: [] });

	var exists = false;

	Fit.Array.ForEach(basket.Items, function(item)
	{
		if (item.ProductId === productId)
		{
			exists = true;
			item.Units = units;

			return false; // Break loop
		}
	});

	if (exists === true)
	{
		Fit.Cookies.Set("JSShopBasket", JSON.stringify(basket)); // Session cookie
	}
	else
	{
		// In the very odd case where the user changed the number of
		// units after removing the product from the basket in another window.
		JSShop.Models.Basket.Add(productId, units);
	}
}

JSShop.Models.Basket.Remove = function(productId)
{
	Fit.Validation.ExpectStringValue(productId);

	var basketData = Fit.Cookies.Get("JSShopBasket");
	var basket = ((basketData !== null) ? JSON.parse(basketData) : { Items: [] });
	var newBasket = { Items: [] };

	Fit.Array.ForEach(basket.Items, function(item)
	{
		if (item.ProductId !== productId)
			Fit.Array.Add(newBasket.Items, item);
	});

	Fit.Cookies.Set("JSShopBasket", JSON.stringify(newBasket)); // Session cookie
}

JSShop.Models.Basket.GetItems = function()
{
	var basketData = Fit.Cookies.Get("JSShopBasket");
	var basket = ((basketData !== null) ? JSON.parse(basketData) : { Items: [] });

	return basket.Items;
}

JSShop.Models.Basket.Clear = function()
{
	Fit.Cookies.Remove("JSShopBasket");
}

JSShop.Models.Basket.CreateOrder = function(cbSuccess)
{
	Fit.Validation.ExpectFunction(cbSuccess);

	// WARNING:
	// Data should be validated server side before checkout to
	// prevent malicious users from tampering with prices or discounts !

	var basketData = Fit.Cookies.Get("JSShopBasket");
	var basket = ((basketData !== null) ? JSON.parse(basketData) : { Items: [] });

	var order = new JSShop.Models.Order(Fit.Data.CreateGuid());
	var orderEntries = [];

	Fit.Array.ForEach(basket.Items, function(item) // Consider batching these operations for better performance
	{
		var entry = new JSShop.Models.OrderEntry(Fit.Data.CreateGuid());
		entry.OrderId(order.Id());
		entry.ProductId(item.ProductId);
		entry.Units(item.Units);
		entry.Create(function(eReq, eModel)
		{
			Fit.Array.Add(orderEntries, entry);

			if (orderEntries.length === basket.Items.length)
			{
				order.Create(function(oReq, oModel)
				{
					cbSuccess(order);
				});
			}
		});
	});
}
