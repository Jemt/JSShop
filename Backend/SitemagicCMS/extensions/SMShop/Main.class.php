<?php

SMExtensionManager::Import("SMExtensionCommon", "SMExtensionCommon.class.php", true);
require_once(dirname(__FILE__) . "/FrmShop.class.php");
require_once(dirname(__FILE__) . "/FrmProducts.class.php");

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
		SMEnvironment::GetMasterTemplate()->RegisterResource(SMTemplateResource::$JavaScript, SMExtensionManager::GetExtensionPath($this->name) . "/JSShop/Fit.UI/Fit.UI.js");
		SMEnvironment::GetMasterTemplate()->RegisterResource(SMTemplateResource::$StyleSheet, SMExtensionManager::GetExtensionPath($this->name) . "/JSShop/Fit.UI/Fit.UI.css");
		SMEnvironment::GetMasterTemplate()->RegisterResource(SMTemplateResource::$JavaScript, SMExtensionManager::GetExtensionPath($this->name) . "/JSShop/JSShop.js");

		$basePath = SMEnvironment::GetInstallationPath(); // Use full path to prevent problems when calling WebServices under /shop/XYZ which would be redirected to / without preserving POST data (htaccess)
		$basePath .= (($basePath !== "/") ? "/" : "");

		$dsCallback = $basePath . SMExtensionManager::GetCallbackUrl($this->name, "Callbacks/DataSource");
		$fsCallback = $basePath . SMExtensionManager::GetCallbackUrl($this->name, "Callbacks/Files");

		$jsInit = "
		<script type=\"text/javascript\">
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
				catId = catId.replace(/[^A-Za-z0-9_-]/g, \"\"); // Remove invalid characters (^ in a range means NOT)

				if (catId !== category)
				{
					// Two different categories can end up with the same Category ID, e.g. X�Y�Z and X.Y.Z = XYZ.
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
			alert('WebService communication failed (' + operation + '):\\n' + request.GetResponseText());
		};
		</script>
		";

		SMEnvironment::GetMasterTemplate()->AddToHeadSection($jsInit);

		/*if ($this->smMenuExists === true)
		{
			if (SMMenuLinkList::GetInstance()->GetReadyState() === true)
			{
				$menuLinkList = SMMenuLinkList::GetInstance();
				$menuLinkList->AddLink($this->getTranslation("LoginForm"), $this->getTranslation("Login"), SMExtensionManager::GetExtensionUrl("SMLogin"));
				$menuLinkList->AddLink($this->getTranslation("LoginForm"), $this->getTranslation("Logout"), SMExtensionManager::GetExtensionUrl("SMLogin") . "&SMLoginFunc=logout");
			}
		}

		if ($this->smPagesExists === true)
		{
			if (SMPagesLinkList::GetInstance()->GetReadyState() === true)
			{
				$pagesLinkList = SMPagesLinkList::GetInstance();
				$pagesLinkList->AddLink($this->getTranslation("LoginForm"), $this->getTranslation("Login"), SMExtensionManager::GetExtensionUrl("SMLogin"));
				$pagesLinkList->AddLink($this->getTranslation("LoginForm"), $this->getTranslation("Logout"), SMExtensionManager::GetExtensionUrl("SMLogin") . "&SMLoginFunc=logout");
			}
		}*/
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
				$menuItem->AddChild(new SMMenuItem($this->name, $this->getTranslation("Title"), SMExtensionManager::GetExtensionUrl($this->name) . "&SMShopEditProducts"));
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