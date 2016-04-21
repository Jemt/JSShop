<?php

class SMShopFrmBasket implements SMIExtensionForm
{
	private $context;
	private $lang;

	public function __construct(SMContext $context)
	{
		$this->context = $context;
		$this->lang = new SMLanguageHandler($this->context->GetExtensionName());

		$this->context->GetTemplate()->ReplaceTag(new SMKeyValue("Title", $this->lang->GetTranslation("Basket")));

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
		$extPath = SMExtensionManager::GetExtensionPath($this->context->GetExtensionName());
		SMEnvironment::GetMasterTemplate()->RegisterResource(SMTemplateResource::$StyleSheet, $extPath . "/JSShop/Views/Basket.css", true);

		$output = "
		<div id=\"" . $this->context->GetExtensionName() . "BasketContainer\"></div>
		<br>
		<div id=\"" . $this->context->GetExtensionName() . "OrderFormContainer\"></div>

		<script type=\"text/javascript\">

		JSShop.Initialize(function()
		{
			var b = new JSShop.Presenters.Basket();
			b.Render(document.getElementById(\"" . $this->context->GetExtensionName() . "BasketContainer\"));

			var o = new JSShop.Presenters.OrderForm();
			o.Render(document.getElementById(\"" . $this->context->GetExtensionName() . "OrderFormContainer\"));
		});

		</script>
		";

		return $output;
	}
}

?>
