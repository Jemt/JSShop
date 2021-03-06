<?php

class SMShopFrmProducts implements SMIExtensionForm
{
	private $context;
	private $lang;

	public function __construct(SMContext $context)
	{
		$this->context = $context;
		$this->lang = new SMLanguageHandler($this->context->GetExtensionName());

		$this->createControls();
		$this->handlePostBack();
	}

	private function createControls()
	{
	}

	private function handlePostBack()
	{
		if ($this->context->GetForm()->PostBack() === true)
		{
		}
	}

	public function Render()
	{
		// Get Category ID

		$catId = SMEnvironment::GetQueryValue("SMShopCategory");

		// Load products

		$ds = new SMDataSource("SMShopProducts");
		$where = (($catId !== null && $catId !== "Overview") ? "CategoryId = '" . $ds->Escape($catId) . "'" : "");

		$products = $ds->Select("*", $where);

		if ($catId !== "Overview" && count($products) > 0 && $products[0]["CategoryId"] !== $catId) // SEO: Make CategoryId case sensitive
			$products = array();

		// Add additional data

		foreach ($products as $prod)
		{
			// Notice: Data in DataSource uses lowercase keys.
			// Therefore place holders in template, to which data is mapped,
			// will be transformed to lowercase keys (see lowerCasePlaceHolders(..)).
			// Entries added below therefore also have to use lowercase keys.

			if ($prod["Vat"] === "" || (float)$prod["Vat"] === 0.0)
				$prod["fullprice"] = $prod["Price"];
			else
				$prod["fullprice"] = (string)round((float)$prod["Price"] + ((float)$prod["Price"] * ((float)$prod["Vat"]/100)), 2);

			$prod["buy"] = $this->lang->GetTranslation("Buy");
			$prod["readmore"] = $this->lang->GetTranslation("ReadMore");
		}

		// Set page title

		$title = (($catId === "Overview") ? $this->lang->GetTranslation("Overview") : ((count($products) > 0) ? $products[0]["Category"] : $this->lang->GetTranslation("NoProducts")));

		$this->context->GetTemplate()->ReplaceTag(new SMKeyValue("Title", $title));
		$output = "<h1>" . $title . "</h1>";

		// Load view and populate data

		$extPath = SMExtensionManager::GetExtensionPath($this->context->GetExtensionName());

		SMEnvironment::GetMasterTemplate()->RegisterResource(SMTemplateResource::$StyleSheet, $extPath . "/JSShop/Views/ProductList.css", true);

		$view = new SMTemplate($extPath . "/JSShop/Views/ProductList.html");
		$this->lowerCasePlaceHolders($view); // Data in DataSource uses lowercase keys, so place holders must use the same casing
		$view->ReplaceTagsRepeated("Products", $products);

		// Insert images

		$images = array();

		foreach ($products as $prod)
		{
			if ($prod["Images"] === "")
				continue;

			$images = array();

			foreach (explode(";", $prod["Images"]) as $src)
			{
				$images[] = new SMKeyValueCollection();
				$images[count($images) - 1]["image"] = $src;
			}

			$view->ReplaceTagsRepeated("Images" . $prod["Id"], $images);
		}

		// Add JSShop init script

		$output .= "
		<script type=\"text/javascript\">

		JSShop.Initialize(function()
		{
			JSShop.Presenters.ProductList.Initialize(document.getElementById('JSShopProductList'));
		});

		</script>
		";

		// Return result

		return $output . $view->GetContent();
	}

	private function lowerCasePlaceHolders(SMTemplate $view)
	{
		$view->SetContent(preg_replace_callback("/\\{\\[(.*)\\]\\}/mU", "smShopPregReplaceCallback", $view->GetContent()));
	}
}

function smShopPregReplaceCallback($matches)
{
	return strtolower($matches[0]);
}

?>
