if (!window.JSShop)
	Fit.Validation.ThrowError("JSShop.js must be loaded");

JSShop.Presenters.OrderForm = function()
{
	var view = null;
	var model = null;
	var lang = JSShop.Language.Translations.OrderForm;

	// Controls
	var txtCompany = null;
	var txtFirstName = null;
	var txtLastName = null;
	var txtAddress = null;
	var txtZipCode = null;
	var txtCity = null;
	var txtEmail = null;
	var txtPhone = null;
	var txtMessage = null;
	var chkRememberMe = null;
	var chkAlternativeAddress = null;
	var txtAltCompany = null;
	var txtAltFirstName = null;
	var txtAltLastName = null;
	var txtAltAddress = null;
	var txtAltZipCode = null;
	var txtAltCity = null;
	var lstPaymentMethod = null;
	var chkAcceptTerms = null;
	var cmdContinue = null;

	function init()
	{
		// Load view

		view = document.createElement("div");

		if (JSShop.Models.Basket.GetItems().length === 0)
			return;

		if (document.querySelector("link[href*='/Views/OrderForm.css']") === null) // Might have been loaded by CMS to prevent flickering (FOUC - flash of unstyled content)
			Fit.Loader.LoadStyleSheet(JSShop.GetPath() + "/Views/OrderForm.css");

		var req = new Fit.Http.Request(JSShop.GetPath() + "/Views/OrderForm.html");
		req.OnSuccess(function(sender)
		{
			view.innerHTML = req.GetResponseText();

			var addressForm = view.querySelector("div.JSShopAddress");
			var altAddressForm = view.querySelector("div.JSShopAlternativeAddress");
			var paymentForm = view.querySelector("div.JSShopPaymentForm");

			altAddressForm.style.display = ((chkAlternativeAddress.Checked() === true) ? "block" : "none");

			// Controls - order form

			Fit.Dom.Add(addressForm.querySelector("#JSShop-Headline-Label"), document.createTextNode(lang.CustomerDetails));

			Fit.Dom.Add(addressForm.querySelector("#JSShop-Company-Label"), document.createTextNode(lang.Company));
			txtCompany.Render(addressForm.querySelector("#JSShop-Company-Control"));

			Fit.Dom.Add(addressForm.querySelector("#JSShop-FirstName-Label"), document.createTextNode(lang.FirstName));
			txtFirstName.Render(addressForm.querySelector("#JSShop-FirstName-Control"));

			Fit.Dom.Add(addressForm.querySelector("#JSShop-LastName-Label"), document.createTextNode(lang.LastName));
			txtLastName.Render(addressForm.querySelector("#JSShop-LastName-Control"));

			Fit.Dom.Add(addressForm.querySelector("#JSShop-Address-Label"), document.createTextNode(lang.Address));
			txtAddress.Render(addressForm.querySelector("#JSShop-Address-Control"));

			Fit.Dom.Add(addressForm.querySelector("#JSShop-ZipCode-Label"), document.createTextNode(lang.ZipCode));
			txtZipCode.Render(addressForm.querySelector("#JSShop-ZipCode-Control"));

			Fit.Dom.Add(addressForm.querySelector("#JSShop-City-Label"), document.createTextNode(lang.City));
			txtCity.Render(addressForm.querySelector("#JSShop-City-Control"));

			Fit.Dom.Add(addressForm.querySelector("#JSShop-Email-Label"), document.createTextNode(lang.Email));
			txtEmail.Render(addressForm.querySelector("#JSShop-Email-Control"));

			Fit.Dom.Add(addressForm.querySelector("#JSShop-Phone-Label"), document.createTextNode(lang.Phone));
			txtPhone.Render(addressForm.querySelector("#JSShop-Phone-Control"));

			Fit.Dom.Add(addressForm.querySelector("#JSShop-Message-Label"), document.createTextNode(lang.Message));
			txtMessage.Render(addressForm.querySelector("#JSShop-Message-Control"));

			chkRememberMe.Render(addressForm.querySelector("#JSShop-RememberMe-Control"));

			chkAlternativeAddress.Render(addressForm.querySelector("#JSShop-AlternativeAddress-Control"));

			// Controls - alternative delivery address

			Fit.Dom.Add(altAddressForm.querySelector("#JSShop-AlternativeHeadline-Label"), document.createTextNode(lang.AlternativeAddress));

			Fit.Dom.Add(altAddressForm.querySelector("#JSShop-AlternativeCompany-Label"), document.createTextNode(lang.Company));
			txtAltCompany.Render(altAddressForm.querySelector("#JSShop-AlternativeCompany-Control"));

			Fit.Dom.Add(altAddressForm.querySelector("#JSShop-AlternativeFirstName-Label"), document.createTextNode(lang.FirstName));
			txtAltFirstName.Render(altAddressForm.querySelector("#JSShop-AlternativeFirstName-Control"));

			Fit.Dom.Add(altAddressForm.querySelector("#JSShop-AlternativeLastName-Label"), document.createTextNode(lang.LastName));
			txtAltLastName.Render(altAddressForm.querySelector("#JSShop-AlternativeLastName-Control"));

			Fit.Dom.Add(altAddressForm.querySelector("#JSShop-AlternativeAddress-Label"), document.createTextNode(lang.Address));
			txtAltAddress.Render(altAddressForm.querySelector("#JSShop-AlternativeAddress-Control"));

			Fit.Dom.Add(altAddressForm.querySelector("#JSShop-AlternativeZipCode-Label"), document.createTextNode(lang.ZipCode));
			txtAltZipCode.Render(altAddressForm.querySelector("#JSShop-AlternativeZipCode-Control"));

			Fit.Dom.Add(altAddressForm.querySelector("#JSShop-AlternativeCity-Label"), document.createTextNode(lang.City));
			txtAltCity.Render(altAddressForm.querySelector("#JSShop-AlternativeCity-Control"));

			// Controls - terms and payment methods

			if (lstPaymentMethod !== null && chkAcceptTerms !== null)
				Fit.Dom.Add(paymentForm.querySelector("#JSShop-Header-Label"), document.createTextNode(lang.PaymentAndTerms));
			else if (lstPaymentMethod !== null)
				Fit.Dom.Add(paymentForm.querySelector("#JSShop-Header-Label"), document.createTextNode(lang.Payment));
			else if (chkAcceptTerms !== null)
				Fit.Dom.Add(paymentForm.querySelector("#JSShop-Header-Label"), document.createTextNode(lang.Terms));

			if (lstPaymentMethod !== null)
			{
				Fit.Dom.Add(paymentForm.querySelector("#JSShop-PaymentMethod-Label"), document.createTextNode(lang.PaymentMethod));
				lstPaymentMethod.Render(paymentForm.querySelector("#JSShop-PaymentMethod-Control"));
			}

			if (chkAcceptTerms !== null)
			{
				chkAcceptTerms.Render(paymentForm.querySelector("#JSShop-AcceptTerms-Control"));

				var dialog = new Fit.Controls.Dialog();
				dialog.Modal(true);
				dialog.Content("<iframe src='" + JSShop.Settings.TermsUrl + "' frameBorder='0' style='width: 100%; height; 100%;' allowtransparency='true'></iframe>");

				var cmdOk = new Fit.Controls.Button("JSShopOkButton");
				cmdOk.Type(Fit.Controls.Button.Type.Success);
				cmdOk.Title(JSShop.Language.Translations.Common.Ok);
				cmdOk.OnClick(function(sender)
				{
					chkAcceptTerms.Checked(true);
					dialog.Close();
				});
				dialog.AddButton(cmdOk);

				var cmdCancel = new Fit.Controls.Button("JSShopCancelButton");
				cmdCancel.Type(Fit.Controls.Button.Type.Danger);
				cmdCancel.Title(JSShop.Language.Translations.Common.Cancel);
				cmdCancel.OnClick(function(sender)
				{
					chkAcceptTerms.Checked(false);
					dialog.Close();
				});
				dialog.AddButton(cmdCancel);

				var link = Fit.Dom.CreateElement(" (<a href='javascript:'>" + lang.Read + "</a>)", "span");
				link.onclick = function(e)
				{
					dialog.Open();
				}
				Fit.Dom.InsertAfter(chkAcceptTerms.GetDomElement(), link);
			}

			cmdContinue.Render(paymentForm.querySelector("#JSShop-Continue-Control"));
		});
		req.Start();

		txtCompany = new Fit.Controls.Input("JSShopCompany");
		txtCompany.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtCompany.Scope("JSShopOrderForm");
		txtCompany.LazyValidation(true);
		txtCompany.OnChange(saveValue);
		txtCompany.Width(100, "%");

		txtFirstName = new Fit.Controls.Input("JSShopFirstName");
		txtFirstName.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtFirstName.Required(true);
		txtFirstName.Scope("JSShopOrderForm");
		txtFirstName.LazyValidation(true);
		txtFirstName.OnChange(saveValue);
		txtFirstName.Width(100, "%");

		txtLastName = new Fit.Controls.Input("JSShopLastName");
		txtLastName.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtLastName.Required(true);
		txtLastName.Scope("JSShopOrderForm");
		txtLastName.LazyValidation(true);
		txtLastName.OnChange(saveValue);
		txtLastName.Width(100, "%");

		txtAddress = new Fit.Controls.Input("JSShopAddress");
		txtAddress.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtAddress.Required(true);
		txtAddress.Scope("JSShopOrderForm");
		txtAddress.LazyValidation(true);
		txtAddress.OnChange(saveValue);
		txtAddress.Width(100, "%");

		txtZipCode = new Fit.Controls.Input("JSShopZipCode");
		txtZipCode.SetValidationCallback(function(val) { return (val.length <= 20); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtZipCode.Required(true);
		txtZipCode.Scope("JSShopOrderForm");
		txtZipCode.LazyValidation(true);
		txtZipCode.OnChange(saveValue);
		txtZipCode.Width(100, "%");

		txtCity = new Fit.Controls.Input("JSShopCity");
		txtCity.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtCity.Required(true);
		txtCity.Scope("JSShopOrderForm");
		txtCity.LazyValidation(true);
		txtCity.OnChange(saveValue);
		txtCity.Width(100, "%");

		txtEmail = new Fit.Controls.Input("JSShopEmail");
		txtEmail.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtEmail.Required(true);
		txtEmail.Scope("JSShopOrderForm");
		txtEmail.LazyValidation(true);
		txtEmail.OnChange(saveValue);
		txtEmail.Width(100, "%");

		txtPhone = new Fit.Controls.Input("JSShopPhone");
		txtPhone.SetValidationCallback(function(val) { return (val.length <= 20); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		//txtPhone.Required(true);
		txtPhone.Scope("JSShopOrderForm");
		txtPhone.LazyValidation(true);
		txtPhone.OnChange(saveValue);
		txtPhone.Width(100, "%");

		txtMessage = new Fit.Controls.Input("JSShopMessage");
		txtMessage.SetValidationCallback(function(val) { return (val.length <= 250); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtMessage.Scope("JSShopOrderForm");
		txtMessage.LazyValidation(true);
		//txtMessage.OnChange(saveValue);
		txtMessage.MultiLine(true);
		txtMessage.Width(100, "%");
		txtMessage.Height(6, "em");

		chkRememberMe = new Fit.Controls.CheckBox("JSShopRememberMe");
		chkRememberMe.Label(lang.RememberMe);
		chkRememberMe.Value(((JSShop.Cookies.Get(chkRememberMe.GetId()) !== null) ? JSShop.Cookies.Get(chkRememberMe.GetId()) : "false"));
		chkRememberMe.OnChange(function(sender)
		{
			if (chkRememberMe.Checked() === true)
				saveValue(chkRememberMe);
			else
				clearValue(chkRememberMe);
		});
		chkRememberMe.OnChange(function(sender)
		{
			saveValues(); // Saves all control values to cookie store if checkbox is checked, otherwise clears all control values from cookie store
		});

		chkAlternativeAddress = new Fit.Controls.CheckBox("JSShopAlternativeAddress");
		chkAlternativeAddress.Label(lang.AlternativeAddress);
		chkAlternativeAddress.OnChange(saveValue);
		chkAlternativeAddress.OnChange(function(sender)
		{
			if (document.querySelector("div.JSShopAlternativeAddress") !== null) // Null when value is restored from cookie store, and view has not been loaded yet
				document.querySelector("div.JSShopAlternativeAddress").style.display = ((chkAlternativeAddress.Checked() === true) ? "block" : "none");
		});

		txtAltCompany = new Fit.Controls.Input("JSShopAltCompany");
		txtAltCompany.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtAltCompany.Scope("JSShopOrderForm");
		txtAltCompany.LazyValidation(true);
		txtAltCompany.OnChange(saveValue);
		txtAltCompany.Width(100, "%");

		txtAltFirstName = new Fit.Controls.Input("JSShopAltFirstName");
		txtAltFirstName.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtAltFirstName.Scope("JSShopOrderForm");
		txtAltFirstName.LazyValidation(true);
		txtAltFirstName.OnChange(saveValue);
		txtAltFirstName.Width(100, "%");

		txtAltLastName = new Fit.Controls.Input("JSShopAltLastName");
		txtAltLastName.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtAltLastName.Scope("JSShopOrderForm");
		txtAltLastName.LazyValidation(true);
		txtAltLastName.OnChange(saveValue);
		txtAltLastName.Width(100, "%");

		txtAltAddress = new Fit.Controls.Input("JSShopAltAddress");
		txtAltAddress.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtAltAddress.Scope("JSShopOrderForm");
		txtAltAddress.LazyValidation(true);
		txtAltAddress.OnChange(saveValue);
		txtAltAddress.Width(100, "%");

		txtAltZipCode = new Fit.Controls.Input("JSShopAltZipCode");
		txtAltZipCode.SetValidationCallback(function(val) { return (val.length <= 20); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtAltZipCode.Scope("JSShopOrderForm");
		txtAltZipCode.LazyValidation(true);
		txtAltZipCode.OnChange(saveValue);
		txtAltZipCode.Width(100, "%");

		txtAltCity = new Fit.Controls.Input("JSShopAltCity");
		txtAltCity.SetValidationCallback(function(val) { return (val.length <= 50); }, JSShop.Language.Translations.Common.MaxLengthExceeded);
		txtAltCity.Scope("JSShopOrderForm");
		txtAltCity.LazyValidation(true);
		txtAltCity.OnChange(saveValue);
		txtAltCity.Width(100, "%");

		if (JSShop.Settings.PaymentMethods !== null && JSShop.Settings.PaymentMethods.length > 0)
		{
			lstPaymentMethod = new Fit.Controls.DropDown("JSShopPaymentMethod");
			lstPaymentMethod.Required(true);
			lstPaymentMethod.Scope("JSShopOrderForm");
			lstPaymentMethod.OnChange(saveValue);
			lstPaymentMethod.SetPicker(new Fit.Controls.ListView());
			lstPaymentMethod.Width(100, "%");

			Fit.Array.ForEach(JSShop.Settings.PaymentMethods, function(pm)
			{
				lstPaymentMethod.GetPicker().AddItem(pm.Title, pm.Module);
			});
		}

		if (JSShop.Settings.TermsUrl !== null && JSShop.Settings.TermsUrl !== "")
		{
			chkAcceptTerms = new Fit.Controls.CheckBox("JSShopAcceptTerms");
			chkAcceptTerms.Label(lang.AcceptTerms);
		}

		cmdContinue = new Fit.Controls.Button("JSShopContinue");
		cmdContinue.Type(Fit.Controls.Button.Type.Success);
		cmdContinue.Title(lang.Continue);
		cmdContinue.OnClick(function(sender)
		{
			if (chkAcceptTerms !== null && chkAcceptTerms.Checked() === false)
			{
				Fit.Controls.Dialog.Alert(lang.TermsRequired);
				return;
			}

			if (txtPhone.Value() === "")
			{
				var dialog = new Fit.Controls.Dialog();
				dialog.Modal(true);
				dialog.Content(lang.MissingPhoneNumber);

				var cmdContinueWithout = new Fit.Controls.Button("JSShopContinueWithoutButton");
				var cmdGoBack = new Fit.Controls.Button("JSShopGoBackButton");

				cmdContinueWithout.Type(Fit.Controls.Button.Type.Success);
				cmdContinueWithout.Title(lang.ContinueWithout);
				cmdContinueWithout.OnClick(function(sender)
				{
					cmdContinueWithout.Enabled(false);
					cmdGoBack.Enabled(false);

					processOrder(function() // Error handler - unlock UI if processOrder fails
					{
						cmdContinueWithout.Enabled(true);
						cmdGoBack.Enabled(true);
					});
				});
				dialog.AddButton(cmdContinueWithout);

				cmdGoBack.Type(Fit.Controls.Button.Type.Primary);
				cmdGoBack.Title(lang.AddPhoneNumber);
				cmdGoBack.OnClick(function(sender)
				{
					dialog.Close();
					dialog.Dispose();
					txtPhone.Focused(true);
				});
				dialog.AddButton(cmdGoBack);

				dialog.Open();
				return;
			}

			// Inform user that partial information under Alternativ Delivery Address is not valid

			if (chkAlternativeAddress.Checked() === true)
			{
				var altAddressUsed = (txtAltCompany.Value() !== "" || txtAltFirstName.Value() !== "" || txtAltLastName.Value() !== "" || txtAltAddress.Value() !== "" || txtAltZipCode.Value() !== "" || txtAltCity.Value() !== "");
				var altAddressPartial = (altAddressUsed === true && (txtAltFirstName.Value() === "" || txtAltLastName.Value() === "" || txtAltAddress.Value() === "" || txtAltZipCode.Value() === "" || txtAltCity.Value() === ""));

				if (altAddressPartial === true)
				{
					Fit.Controls.Dialog.Alert(lang.PartialAltAddress);
					return;
				}
			}

			if (Fit.Controls.ValidateAll("JSShopOrderForm") === false)
			{
				Fit.Controls.Dialog.Alert(JSShop.Language.Translations.Common.InvalidEntries);
				return;
			}

			processOrder();
		});

		// Restore previously saved values and selections

		restoreValues();

		if (lstPaymentMethod !== null && (lstPaymentMethod.GetSelections().length === 0 || lstPaymentMethod.GetPicker().HasItem(lstPaymentMethod.GetSelections()[0].Value) === false))
			lstPaymentMethod.AddSelection(JSShop.Settings.PaymentMethods[0].Title, JSShop.Settings.PaymentMethods[0].Module);
	}

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

	// Private

	function processOrder(errorCallback)
	{
		Fit.Validation.ExpectFunction(errorCallback, true);

		cmdContinue.Enabled(false);

		var o = new JSShop.Models.Order(Fit.Data.CreateGuid());
		o.Company(txtCompany.Value());
		o.FirstName(txtFirstName.Value());
		o.LastName(txtLastName.Value());
		o.Address(txtAddress.Value());
		o.ZipCode(txtZipCode.Value());
		o.City(txtCity.Value());
		o.Email(txtEmail.Value());
		o.Phone(txtPhone.Value());
		o.Message(txtMessage.Value());
		o.AltCompany(txtAltCompany.Value());
		o.AltFirstName(txtAltFirstName.Value());
		o.AltLastName(txtAltLastName.Value());
		o.AltAddress(txtAltAddress.Value());
		o.AltZipCode(txtAltZipCode.Value());
		o.AltCity(txtAltCity.Value());

		if (lstPaymentMethod !== null)
			o.PaymentMethod(lstPaymentMethod.GetSelections()[0].Value);

		JSShop.Models.Basket.CreateOrder(o, function(order)
		{
			JSShop.Models.Basket.Clear();

			if (JSShop.Settings.PaymentUrl !== null && JSShop.Settings.PaymentUrl !== "")
			{
				location.href = JSShop.Settings.PaymentUrl + ((JSShop.Settings.PaymentUrl.indexOf("?") === -1) ? "?" : "&") + "OrderId=" + order.Id();
			}
			else
			{
				Fit.Controls.Dialog.Alert(lang.OrderReceived, function()
				{
					location.href = location.href;
				});
			}
		},
		function(order) // Error handler
		{
			if (Fit.Validation.IsSet(errorCallback) === true)
				errorCallback();

			cmdContinue.Enabled(true);
		});
	}

	function saveValue(sender)
	{
		if (chkRememberMe.Checked() === true)
			JSShop.Cookies.Set(sender.GetId(), sender.Value(), 60 * 60 * 24 * 365 * 5);
	}

	function restoreValue(sender)
	{
		if (chkRememberMe.Checked() === true && JSShop.Cookies.Get(sender.GetId()) !== null)
			sender.Value(JSShop.Cookies.Get(sender.GetId()));
	}

	function clearValue(sender)
	{
		JSShop.Cookies.Remove(sender.GetId());
	}

	function saveValues()
	{
		var controls = [];
		Fit.Array.Add(controls, txtCompany);
		Fit.Array.Add(controls, txtFirstName);
		Fit.Array.Add(controls, txtLastName);
		Fit.Array.Add(controls, txtAddress);
		Fit.Array.Add(controls, txtZipCode);
		Fit.Array.Add(controls, txtCity);
		Fit.Array.Add(controls, txtEmail);
		Fit.Array.Add(controls, txtPhone);
		//Fit.Array.Add(controls, txtMessage);
		Fit.Array.Add(controls, chkAlternativeAddress);
		Fit.Array.Add(controls, txtAltCompany);
		Fit.Array.Add(controls, txtAltFirstName);
		Fit.Array.Add(controls, txtAltLastName);
		Fit.Array.Add(controls, txtAltAddress);
		Fit.Array.Add(controls, txtAltZipCode);
		Fit.Array.Add(controls, txtAltCity);

		if (lstPaymentMethod !== null)
			Fit.Array.Add(controls, lstPaymentMethod);

		Fit.Array.ForEach(controls, function(ctrl)
		{
			if (chkRememberMe.Checked() === true)
				saveValue(ctrl);
			else
				clearValue(ctrl);
		});
	}

	function restoreValues()
	{
		restoreValue(txtCompany);
		restoreValue(txtFirstName);
		restoreValue(txtLastName);
		restoreValue(txtAddress);
		restoreValue(txtZipCode);
		restoreValue(txtCity);
		restoreValue(txtEmail);
		restoreValue(txtPhone);
		//restoreValue(txtMessage);
		restoreValue(chkAlternativeAddress);
		restoreValue(txtAltCompany);
		restoreValue(txtAltFirstName);
		restoreValue(txtAltLastName);
		restoreValue(txtAltAddress);
		restoreValue(txtAltZipCode);
		restoreValue(txtAltCity);

		if (lstPaymentMethod !== null)
			restoreValue(lstPaymentMethod);
	}

	init();
}
