if (!window.JSShop)
	Fit.Validation.ThrowError("JSShop.js must be loaded");

JSShop.Presenters.Basket = function()
{
	var view = null;
	var basket = JSShop.Models.Basket;
	var lang = JSShop.Language.Translations.Basket;

	view = document.createElement("div");

	function init()
	{
		var items = basket.GetItems();

		// Load CSS

		if (document.querySelector("link[href*='/Views/Basket.css']") === null) // Might have been loaded by CMS to prevent flickering (FOUC - flash of unstyled content)
			Fit.Loader.LoadStyleSheet(JSShop.GetPath() + "/Views/Basket.css");

		// Check basket

		if (items.length === 0)
		{
			view.innerHTML = lang.BasketEmpty;
			return;
		}

		// Load view and data

		var req = new Fit.Http.Request(JSShop.GetPath() + "/Views/Basket.html");
		req.OnSuccess(function(sender)
		{
			var htmlView = req.GetResponseText();

			// Populate header titles

			htmlView = htmlView.replace(/{\[HeaderProduct\]}/g, lang.Product);
			htmlView = htmlView.replace(/{\[HeaderUnitPrice\]}/g, lang.UnitPrice);
			htmlView = htmlView.replace(/{\[HeaderUnits\]}/g, lang.Units);
			htmlView = htmlView.replace(/{\[HeaderDiscount\]}/g, lang.Discount);
			htmlView = htmlView.replace(/{\[HeaderPrice\]}/g, lang.Price);
			htmlView = htmlView.replace(/{\[HeaderTotalVat\]}/g, lang.TotalVat);
			htmlView = htmlView.replace(/{\[HeaderTotalPrice\]}/g, lang.TotalPrice);

			// Extract item HTML

			var startTag = "<!-- REPEAT Items -->";
			var endTag = "<!-- /REPEAT Items -->";

			var regEx = new RegExp(startTag + "[\\s\\S]*" + endTag);
			var res = regEx.exec(htmlView);

			if (res !== null)
			{
				var allItemsHtml = "";
				var totalVat = 0;
				var totalPrice = 0;
				var totalDiscount = 0;
				var totalWeight = 0;

				// Remove <!-- REPEAT Items --> block from item HTML

				var itemHtml = res[0];

				var posStart = itemHtml.indexOf(startTag) + startTag.length;
				var posEnd = itemHtml.indexOf(endTag);

				itemHtml = itemHtml.substring(posStart, posEnd);

				// Load product details

				var itemCount = items.length;
				var currency = null;
				var currencyError = false;
				var weightUnit = null;
				var weightUnitError = false;

				Fit.Array.ForEach(items, function(item)
				{
					var product = new JSShop.Models.Product(item.ProductId);
					product.Retrieve(function(req, model)
					{
						itemCount--;
						item.Product = product;

						if (itemCount === 0) // All products loaded
						{
							// Populate item HTML

							Fit.Array.ForEach(items, function(item)
							{
								// Currency and weight unit validation

								currency = ((currency !== null) ? currency : item.Product.Currency());

								if (item.Product.Currency() !== currency)
									currencyError = true;

								weightUnit = ((weightUnit !== null) ? weightUnit : item.Product.WeightUnit());

								if (item.Product.WeightUnit() !== weightUnit)
									weightUnitError = true;

								// Calculate pricing

								var vatFactor = ((item.Product.Vat() > 0) ? 1 + (item.Product.Vat() / 100) : 1);
								var unitPrice = item.Product.Price() * vatFactor;
								var discountExVat = item.Product.CalculateDiscount(item.Units);
								var discount = discountExVat * vatFactor;
								var priceExVat = (item.Product.Price() * item.Units) - discountExVat;
								var price = priceExVat * vatFactor;
								var vat = price - priceExVat;

								// Populate HTML

								var curItemHtml = itemHtml;

								curItemHtml = curItemHtml.replace(/{\[Title\]}/g, item.Product.Title());
								curItemHtml = curItemHtml.replace(/{\[UnitPrice\]}/g, Fit.Math.Format(unitPrice, 2, JSShop.Language.Translations.Locale.DecimalSeparator));
								curItemHtml = curItemHtml.replace(/{\[Discount\]}/g, Fit.Math.Format(discount, 2, JSShop.Language.Translations.Locale.DecimalSeparator));
								curItemHtml = curItemHtml.replace(/{\[DiscountMessage\]}/g, ((discount > 0) ? item.Product.DiscountMessage() : ""));
								curItemHtml = curItemHtml.replace(/{\[Units\]}/g, "<div id='JSShopBasketItem" + item.ProductId + "'></div>");
								curItemHtml = curItemHtml.replace(/{\[Currency\]}/g, item.Product.Currency());
								curItemHtml = curItemHtml.replace(/{\[Price\]}/g, Fit.Math.Format(price, 2, JSShop.Language.Translations.Locale.DecimalSeparator));

								allItemsHtml += curItemHtml;

								// Calculate totals

								totalVat += vat;
								totalPrice += price;
								totalDiscount += discount;
								totalWeight += item.Units * item.Product.Weight();
							});

							// Calculate shipping expense

							var shippingExpenseExVat = JSShop.Models.Order.CalculateShippingExpense(totalPrice - totalVat, totalVat, currency, totalWeight, weightUnit);

							if (shippingExpenseExVat > 0)
							{
								var vatFactor = ((JSShop.Settings.ShippingExpenseVat > 0) ? 1 + (JSShop.Settings.ShippingExpenseVat / 100) : 1);
								var shippingExpense = shippingExpenseExVat * vatFactor;

								var shippingItemHtml = itemHtml;

								shippingItemHtml = shippingItemHtml.replace(/{\[Title\]}/g, ((JSShop.Settings.ShippingExpenseMessage !== null && JSShop.Settings.ShippingExpenseMessage !== "") ? JSShop.Settings.ShippingExpenseMessage : lang.ShippingExpense));
								shippingItemHtml = shippingItemHtml.replace(/{\[UnitPrice\]}/g, "&nbsp;");
								shippingItemHtml = shippingItemHtml.replace(/{\[Discount\]}/g, "");
								shippingItemHtml = shippingItemHtml.replace(/{\[DiscountMessage\]}/g, "");
								shippingItemHtml = shippingItemHtml.replace(/{\[Units\]}/g, "&nbsp;");
								shippingItemHtml = shippingItemHtml.replace(/{\[Currency\]}/g, currency);
								shippingItemHtml = shippingItemHtml.replace(/{\[Price\]}/g, Fit.Math.Format(shippingExpense, 2, JSShop.Language.Translations.Locale.DecimalSeparator));

								allItemsHtml += shippingItemHtml;

								totalVat += shippingExpense - shippingExpenseExVat;
								totalPrice += shippingExpense;
							}

							// Add totals and update view

							htmlView = htmlView.replace(res[0], allItemsHtml);
							htmlView = htmlView.replace(/{\[Currency\]}/g, items[0].Product.Currency());
							htmlView = htmlView.replace(/{\[TotalVat\]}/g, Fit.Math.Format(totalVat, 2, JSShop.Language.Translations.Locale.DecimalSeparator));
							htmlView = htmlView.replace(/{\[TotalPrice\]}/g, Fit.Math.Format(totalPrice, 2, JSShop.Language.Translations.Locale.DecimalSeparator));
							htmlView = htmlView.replace(/{\[TotalDiscount\]}/g, Fit.Math.Format(totalDiscount, 2, JSShop.Language.Translations.Locale.DecimalSeparator));

							view.innerHTML = htmlView;

							// Create unit updator controls

							Fit.Array.ForEach(items, function(item)
							{
								var cmdUnits = new Fit.Controls.Button(Fit.Data.CreateGuid());
								cmdUnits.Title(item.Units.toString());
								cmdUnits.Type(Fit.Controls.Button.Type.Default);
								cmdUnits.GetDomElement().style.cssText = "font-size: 0.9em; padding: 2px 10px 2px 10px;";
								cmdUnits.Width(4, "em");
								cmdUnits.Render(view.querySelector("#JSShopBasketItem" + item.ProductId));
								cmdUnits.OnClick(function(sender)
								{
									// Create dialog

									var html = "";
									html += "<div style='text-align: center' id='JSShopUnitsDialogInput'>";
									html += "<b>" + item.Product.Title() + "</b><br><br>";
									html += lang.NumberOfUnits + ":<br><br>";
									html += "</div>";

									var dialog = new Fit.Controls.Dialog();
									dialog.Modal(true);
									dialog.Content(html);

									// Create input field

									var units = item.Units.toString();
									var txtUnits = new Fit.Controls.Input(Fit.Data.CreateGuid());
									txtUnits.Value(units);
									txtUnits.Width(4, "em");
									txtUnits.OnChange(function(sender)
									{
										// Validate input - auto correct invalid values

										if (txtUnits.Value() !== "")
										{
											if (isNaN(parseInt(txtUnits.Value())) === true || parseInt(txtUnits.Value()).toString() !== txtUnits.Value() || parseInt(txtUnits.Value()) < 0 || parseInt(txtUnits.Value()) > 999999)
											{
												txtUnits.Value(units);
											}
											else
											{
												units = txtUnits.Value();
											}
										}
									});
									txtUnits.OnBlur(function(sender)
									{
										if (txtUnits.Value() === "")
											txtUnits.Value("0");
									});
									txtUnits.Render(dialog.GetDomElement().querySelector("#JSShopUnitsDialogInput"));

									// Create dialog buttons

									var cmdSave = new Fit.Controls.Button(Fit.Data.CreateGuid());
									cmdSave.Title(JSShop.Language.Translations.Common.Ok);
									cmdSave.Type(Fit.Controls.Button.Type.Success);
									cmdSave.OnClick(function(sender)
									{
										basket.Update(item.ProductId, parseInt(txtUnits.Value()));
										dialog.Close();
										init();
									});
									dialog.AddButton(cmdSave);

									var cmdCancel = new Fit.Controls.Button(Fit.Data.CreateGuid());
									cmdCancel.Title(JSShop.Language.Translations.Common.Cancel);
									cmdCancel.Type(Fit.Controls.Button.Type.Danger);
									cmdCancel.OnClick(function(sender)
									{
										dialog.Close();
									});
									dialog.AddButton(cmdCancel);

									// Add better keyboard support (Enter + Esc)

									Fit.Events.AddHandler(txtUnits.GetDomElement(), "keydown", function(e)
									{
										var ev = Fit.Events.GetEvent(e);

										if (ev.keyCode === 13) // Enter
										{
											if (txtUnits.Value() === "")
												txtUnits.Value("0");

											cmdSave.Click();
										}
									});
									Fit.Events.AddHandler(dialog.GetDomElement(), "keydown", function(e)
									{
										var ev = Fit.Events.GetEvent(e);

										if (ev.keyCode === 27) // ESC
											dialog.Close();
									});

									dialog.Open();
									txtUnits.Focused(true);
								});
							});

							// Display warnings

							if (currencyError === true)
								Fit.Controls.Dialog.Alert("Error - buying products with different currencies is not supported!");
							if (weightUnitError === true)
								Fit.Controls.Dialog.Alert("Error - buying products with different weight units is not supported!");
						}
					});
				})
			}
		});
		req.Start();
	}

	// Public members

	this.Render = function(toElement)
	{
		Fit.Validation.ExpectDomElement(toElement, true);

		if (Fit.Validation.IsSet(toElement) === true)
		{
			Fit.Dom.Add(toElement, view);
		}
		else
		{
			var script = document.scripts[document.scripts.length - 1];
			Fit.Dom.InsertBefore(script, view);
		}
	}

	init();
}
