<?php

SMExtensionManager::Import("SMExtensionCommon", "SMExtensionCommon.class.php", true);
require_once(dirname(__FILE__) . "/FrmShop.class.php");
require_once(dirname(__FILE__) . "/FrmProducts.class.php");
require_once(dirname(__FILE__) . "/FrmBasket.class.php");

class SMShop extends SMExtension
{
	private $name = null;
	private $lang = null;
	private $smMenuExists = false;
	private $smPagesExists = false;

	public function Init()
	{
		$this->name = $this->context->GetExtensionName();
		$this->smMenuExists = SMExtensionManager::ExtensionEnabled("SMMenu");	// False if not installed or not enabled
		$this->smPagesExists = SMExtensionManager::ExtensionEnabled("SMPages");	// False if not installed or not enabled
	}

	public function InitComplete()
	{
		// Add basket and product categories to link pickers

		if ($this->smMenuExists === true && SMMenuLinkList::GetInstance()->GetReadyState() === true)
		{
			$ds = new SMDataSource("SMShopProducts");
			$products = $ds->Select("Category, CategoryId", "", "Category ASC");

			$menuLinkList = SMMenuLinkList::GetInstance();
			$added = array();

			foreach ($products as $prod)
			{
				if (in_array($prod["CategoryId"], $added, true) === true)
					continue;

				$menuLinkList->AddLink($this->getTranslation("Title"), $prod["Category"], "shop/" . $prod["CategoryId"]);
				$added[] = $prod["CategoryId"];
			}
		}

		if ($this->smPagesExists === true && SMPagesLinkList::GetInstance()->GetReadyState() === true)
		{
			$ds = new SMDataSource("SMShopProducts");
			$products = $ds->Select("Category, CategoryId", "", "Category ASC");

			$pagesLinkList = SMPagesLinkList::GetInstance();
			$added = array();

			foreach ($products as $prod)
			{
				if (in_array($prod["CategoryId"], $added, true) === true)
					continue;

				$pagesLinkList->AddLink($this->getTranslation("Title"), $prod["Category"], "shop/" . $prod["CategoryId"]);
				$added[] = $prod["CategoryId"];
			}
		}

		// Load JS and CSS resources

		SMEnvironment::GetMasterTemplate()->RegisterResource(SMTemplateResource::$JavaScript, SMExtensionManager::GetExtensionPath($this->name) . "/JSShop/Fit.UI/Fit.UI.js");
		SMEnvironment::GetMasterTemplate()->RegisterResource(SMTemplateResource::$StyleSheet, SMExtensionManager::GetExtensionPath($this->name) . "/JSShop/Fit.UI/Fit.UI.css", true);
		SMEnvironment::GetMasterTemplate()->RegisterResource(SMTemplateResource::$JavaScript, SMExtensionManager::GetExtensionPath($this->name) . "/JSShop/JSShop.js");

		// Configure JSShop

		$basePath = SMEnvironment::GetInstallationPath(); // Use full path to prevent problems when calling WebServices under /shop/XYZ which would be redirected to / without preserving POST data (htaccess)
		$basePath .= (($basePath !== "/") ? "/" : "");

		$dsCallback = $basePath . SMExtensionManager::GetCallbackUrl($this->name, "Callbacks/DataSource");
		$fsCallback = $basePath . SMExtensionManager::GetCallbackUrl($this->name, "Callbacks/Files");
		$payCallback = $basePath . SMExtensionManager::GetCallbackUrl($this->name, "Callbacks/Payment");

		$langCode = SMLanguageHandler::GetSystemLanguage();
		$shopLang = ((SMFileSystem::FileExists(dirname(__FILE__) . "/JSShop/Languages/" . $langCode . ".js") === true) ? $langCode : "en");

		$cookiePrefix = ((SMEnvironment::IsSubSite() === false) ? "SMRoot" : ""); // Prevent cookies on root site from causing naming conflicts with cookies on subsites
		$cookiePath = SMEnvironment::GetInstallationPath(); // Prevent /shop virtual directory from being used as cookie path when adding products to basket by forcing cookie path

		$jsInit = "
		<script type=\"text/javascript\">
		JSShop.Settings.ShippingExpenseExpression = \"" . ((SMAttributes::GetAttribute("SMShopShippingExpenseExpression") !== null) ? SMAttributes::GetAttribute("SMShopShippingExpenseExpression") : "") . "\";
		JSShop.Settings.ShippingExpenseVat = " . ((SMAttributes::GetAttribute("SMShopShippingExpenseVat") !== null && SMAttributes::GetAttribute("SMShopShippingExpenseVat") !== "") ? SMAttributes::GetAttribute("SMShopShippingExpenseVat") : "0") . ";
		JSShop.Settings.ShippingExpenseMessage = \"" . ((SMAttributes::GetAttribute("SMShopShippingExpenseMessage") !== null) ? SMAttributes::GetAttribute("SMShopShippingExpenseMessage") : "") . "\";
		JSShop.Settings.BasketUrl = \"" . SMExtensionManager::GetExtensionUrl($this->name) . "&SMShopBasket" . "\";
		JSShop.Settings.TermsUrl = \"" . ((SMAttributes::GetAttribute("SMShopTermsPage") !== null) ? SMAttributes::GetAttribute("SMShopTermsPage") : "") . "\";
		JSShop.Settings.PaymentUrl = \"" . $payCallback . "\";

		JSShop.Language.Name = \"" . $shopLang . "\";

		JSShop.Cookies.Prefix(\"" . $cookiePrefix . "\" + JSShop.Cookies.Prefix());
		JSShop.Cookies.Path(\"" . $cookiePath . "\");

		JSShop.WebService.Products.Create = \"" . $dsCallback . "\";
		JSShop.WebService.Products.Retrieve = \"" . $dsCallback . "\";
		JSShop.WebService.Products.RetrieveAll = \"" . $dsCallback . "\";
		JSShop.WebService.Products.Update = \"" . $dsCallback . "\";
		JSShop.WebService.Products.Delete = \"" . $dsCallback . "\";

		JSShop.WebService.Files.Upload = \"" . $fsCallback . "\"; // Expected to respond with file path on server
		JSShop.WebService.Files.Remove = \"" . $fsCallback . "\";

		JSShop.WebService.Orders.Create = \"" . $dsCallback . "\";
		JSShop.WebService.Orders.Retrieve = \"" . $dsCallback . "\";
		JSShop.WebService.Orders.RetrieveAll = \"" . $dsCallback . "\";
		JSShop.WebService.Orders.Update = \"" . $dsCallback . "\";
		JSShop.WebService.Orders.Delete = \"" . $dsCallback . "\";

		JSShop.WebService.OrderEntries.Create = \"" . $dsCallback . "\";
		JSShop.WebService.OrderEntries.Retrieve = \"" . $dsCallback . "\";
		JSShop.WebService.OrderEntries.RetrieveAll = \"" . $dsCallback . "\";
		JSShop.WebService.OrderEntries.Update = \"" . $dsCallback . "\";
		JSShop.WebService.OrderEntries.Delete = \"" . $dsCallback . "\";

		JSShop.Events.OnRequest = function(request, models, operation)
		{
			// Unicode encode data

			var data = request.GetData();
			var properties = data.Properties;

			Fit.Array.ForEach(properties, function(prop)
			{
				if (typeof(properties[prop]) === \"string\")
					properties[prop] = SMStringUtilities.UnicodeEncode(properties[prop]);
			});

			// Product model: Create URL friendly category name

			if ((operation === \"Create\" || operation === \"Update\") && Fit.Core.InstanceOf(models[0], JSShop.Models.Product) === true)
			{
				var category = properties[\"Category\"];
				var catId = category;

				catId = catId.replace(/ /g, \"_\"); // Replace spaces with underscores

				// Support alternatives to danish characters
				catId = catId.replace(/Æ/g, \"Ae\");
				catId = catId.replace(/æ/g, \"ae\");
				catId = catId.replace(/Ø/g, \"Eo\");
				catId = catId.replace(/ø/g, \"oe\");
				catId = catId.replace(/Å/g, \"Aa\");
				catId = catId.replace(/å/g, \"aa\");

				catId = catId.replace(/[^A-Za-z0-9_-]/g, \"\"); // Remove invalid characters (^ in a range means NOT)

				if (catId !== category)
				{
					// Two different categories can end up with the same Category ID, e.g. XæYæZ and X.Y.Z = XYZ.
					// This will especially be true if categories only consists of invalid characters (unicode),
					// in which case the Category ID will now be empty. Therefore, a hash code representing the
					// name of the category is used to create a unique and valid Category ID.

					var hash = Fit.String.Hash(category);
					catId = ((catId !== \"\") ? catId : \"cat\") + \"-\" + ((hash < 0) ? \"m\" : \"\") + Math.abs(hash);
				}

				properties[\"CategoryId\"] = catId; // NOTICE: CategoryId is NOT defined in Product model, only here in JSON data
			}

			request.SetData(data);
		};

		JSShop.Events.OnSuccess = function(request, models, operation)
		{
			if (operation === \"Retrieve\" || operation === \"RetrieveAll\")
			{
				// Decode unicode encoded data

				Fit.Array.ForEach(models, function(model)
				{
					var properties = model.GetProperties();

					Fit.Array.ForEach(properties, function(prop)
					{
						if (typeof(properties[prop]) === \"string\")
							model[prop](SMStringUtilities.UnicodeDecode(model[prop]())); // Never manipulate properties directly - using Setter function
					});
				});
			}
		};
		JSShop.Events.OnError = function(request, models, operation)
		{
			Fit.Controls.Dialog.Alert('WebService communication failed (' + operation + '):<br><br>' + request.GetResponseText().replace(\"<pre>\", \"<pre style='overflow: auto'>\"));
		};
		</script>
		";

		SMEnvironment::GetMasterTemplate()->AddToHeadSection($jsInit);
	}

	public function Render()
	{
		if (SMEnvironment::GetQueryValue("SMShopEditProducts") !== null)
		{
			if (SMAuthentication::Authorized() === false)
				SMExtensionManager::ExecuteExtension(SMExtensionManager::GetDefaultExtension());

			$frm = new SMShopFrmShop($this->context);
			return $frm->Render();
		}
		if (SMEnvironment::GetQueryValue("SMShopBasket") !== null)
		{
			$frm = new SMShopFrmBasket($this->context);
			return $frm->Render();
		}
		else
		{
			$frm = new SMShopFrmProducts($this->context);
			return $frm->Render();
		}
	}

	public function PreTemplateUpdate()
	{
		if ($this->smMenuExists === true)
		{
			$menuItem = SMMenuManager::GetInstance()->GetChild("SMMenuContent");

			if ($menuItem !== null)
				$menuItem->AddChild(new SMMenuItem($this->name, $this->getTranslation("Products"), SMExtensionManager::GetExtensionUrl($this->name) . "&SMShopEditProducts"));
		}
	}

	private function getTranslation($key)
	{
		SMTypeCheck::CheckObject(__METHOD__, "key", $key, SMTypeCheckType::$String);

		if ($this->lang === null)
			$this->lang = new SMLanguageHandler($this->name);

		return $this->lang->GetTranslation($key);
	}
}

?>
