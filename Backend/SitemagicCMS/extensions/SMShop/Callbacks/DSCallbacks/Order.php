<?php

// Functions invoked from DataSource.callback.php (in the context of Sitemagic)

function SMShopDeleteOrderEntries($orderId)
{
	$eDs = new SMDataSource("SMShopOrderEntries");

	if ($eDs->GetDataSourceType() === SMDataSourceType::$Xml)
		$eDs->Lock();

	$eDs->Delete("OrderId = '" . $eDs->Escape($orderId) . "'");
	$eDs->Commit(); // Also releases lock
}

function SMShopProcessNewOrder(SMKeyValueCollection $order)
{
	// Variables

	$eDs = new SMDataSource("SMShopOrderEntries");
	$pDs = new SMDataSource("SMShopProducts");

	$products = null;
	$product = null;

	$discount = 0;
	$discountExpression = null;
	$expr = null;
	$price = 0;

	$priceTotal = 0;
	$vatTotal = 0;
	$currency = null;
	$weightTotal = 0;
	$weightUnit = null;
	$shippingExpense = 0;
	$shippingVat = 0;

	// Load order entries

	if ($eDs->GetDataSourceType() === SMDataSourceType::$Xml)
		$eDs->Lock();

	$entries = $eDs->Select("*", "OrderId = '" . $eDs->Escape($order["Id"]) . "'");

	// Ensure that order has order entries associated

	if (count($entries) === 0) // Unlikely to happen, unless Order was created programmatically using JS API
	{
		header("HTTP/1.1 500 Internal Server Error");
		echo "Inconsistent order - no associated order entries found (must be created first)";
		exit;
	}

	// Obtain new order ID (order was created with a temporary ID (GUID) generated client side)

	SMAttributes::Lock(); // Prevent two sessions from obtaining the same Order ID
	SMAttributes::Reload(false); // No data will be lost when reloading attributes from a callback since no extensions are being executed

	$orderIdStr = SMAttributes::GetAttribute("SMShopNextOrderId");
	$orderId = (($orderIdStr !== null) ? (int)$orderIdStr : 1);

	SMAttributes::SetAttribute("SMShopNextOrderId", (string)($orderId + 1));
	SMAttributes::Commit(); // Also releases lock

	// Loop through order entries to extract currency, calculate
	// discounts/totals/VAT, and update entries with these information.

	foreach ($entries as $entry)
	{
		// Get product associated with entry

		$products = $pDs->Select("*", "Id = '" . $entry["ProductId"] . "'");

		if (count($products) === 0) // Very unlikely to happen, but theoretically possible
		{
			header("HTTP/1.1 500 Internal Server Error");
			echo "Product with ID '" . $entry["ProductId"] . "' has been removed";
			exit;
		}

		$product = $products[0];

		// Make sure all products are defined with the same currency and weight unit

		$currency = (($currency !== null) ? $currency : $product["Currency"]);

		if ($currency !== $product["Currency"])
		{
			header("HTTP/1.1 500 Internal Server Error");
			echo "Buying products with different currencies is not supported";
			exit;
		}

		$weightUnit = (($weightUnit !== null) ? $weightUnit : $product["WeightUnit"]);

		if ($weightUnit !== $product["WeightUnit"])
		{
			header("HTTP/1.1 500 Internal Server Error");
			echo "Buying products with different weight units is not supported";
			exit;
		}

		// Get discount expression

		$discount = 0;
		$discountExpression = $product["DiscountExpression"];

		if ($discountExpression !== "")
		{
			// Security validation

			//$discountExpression = preg_replace("/Math\\.[a-z]+/i", "", $discountExpression);
			$discountExpression = preg_replace("/ |[0-9]|\\*|\\+|\\-|\\/|=|&|\\||!|\\.|:|\\(|\\)|>|<|\\?|true|false/", "", $discountExpression);
			$discountExpression = preg_replace("/units|price|vat|currency|weight|weightunit/", "", $discountExpression);

			if ($discountExpression !== "") // All valid elements were removed above, so if $discountExpression contains anything, it is potentially a security threat
			{
				header("HTTP/1.1 500 Internal Server Error");
				echo "Invalid and potentially insecure DiscountExpression detected";
				exit;
			}

			// Make variables available to discount expression

			$expr = "";
			$expr .= "\nunits = " . $entry["Units"] . ";";
			$expr .= "\nprice = " . $product["Price"] . ";";
			$expr .= "\nvat = " . $product["Vat"] . ";";
			$expr .= "\ncurrency = \"" . $product["Currency"] . "\";";
			$expr .= "\nweight = " . $product["Weight"] . ";";
			$expr .= "\nweightunit = \"" . $product["WeightUnit"] . "\";";
			$expr .= "\nreturn (" . $product["DiscountExpression"] . ");";

			// Turn JS variables into PHP compliant variables

			$expr = str_replace("units", "\$units", $expr);
			$expr = str_replace("price", "\$price", $expr);
			$expr = str_replace("vat", "\$vat", $expr);
			$expr = str_replace("currency", "\$currency", $expr);
			$expr = str_replace("weight", "\$weight", $expr); // $weight AND $weightunit (both starts with "weight")

			// Evaluate discount expression, and calculate price and VAT

			$discount = eval($expr);

			if (is_numeric($discount) === false)
			{
				header("HTTP/1.1 500 Internal Server Error");
				echo "DiscountExpression did not result in a valid numeric value";
				exit;
			}
		}

		// Totals

		$price = ((int)$entry["Units"] * (float)$product["Price"]) - $discount;

		$priceTotal += $price;
		$vatTotal += $price * ((float)$product["Vat"] / 100);
		$weightTotal += (int)$entry["Units"] * (float)$product["Weight"];

		// Update entry

		$entry["OrderId"] = (string)$orderId;
		$entry["UnitPrice"] = $product["Price"];
		$entry["Vat"] = $product["Vat"];
		$entry["Currency"] = $product["Currency"];
		$entry["Discount"] = (string)$discount;
		$entry["DiscountMessage"] = (($discount !== 0) ? $product["DiscountMessage"] : "");

		$eDs->Update($entry, "Id = '" . $eDs->Escape($entry["Id"]) . "'");
	}

	$eDs->Commit();

	// Calculate shipping expense

	$shippingExpenseExpression = SMAttributes::GetAttribute("SMShopShippingExpenseExpression");
	$shippingExpenseVatPercentage = SMAttributes::GetAttribute("SMShopShippingExpenseVat");
	$shippingExpenseMessage = SMAttributes::GetAttribute("SMShopShippingExpenseMessage");

	if ($shippingExpenseExpression !== null && $shippingExpenseExpression !== "")
	{
		// Security validation

		$shippingExpenseExpression = preg_replace("/ |[0-9]|\\*|\\+|\\-|\\/|=|&|\\||!|\\.|:|\\(|\\)|>|<|\\?|true|false/", "", $shippingExpenseExpression);
		$shippingExpenseExpression = preg_replace("/price|vat|currency|weight|weightunit/", "", $shippingExpenseExpression);

		if ($shippingExpenseExpression !== "") // All valid elements were removed above, so if $shippingExpenseExpression contains anything, it is potentially a security threat
		{
			header("HTTP/1.1 500 Internal Server Error");
			echo "Invalid and potentially insecure ShippingExpenseExpression detected";
			exit;
		}

		// Make variables available to discount expression

		$expr = "";
		$expr .= "\nprice = " . $priceTotal . ";";
		$expr .= "\nvat = " . $vatTotal . ";";
		$expr .= "\ncurrency = \"" . $currency . "\";";
		$expr .= "\nweight = " . $weightTotal . ";";
		$expr .= "\nweightunit = \"" . $weightUnit . "\";";
		$expr .= "\nreturn (" . SMAttributes::GetAttribute("SMShopShippingExpenseExpression") . ");";

		// Turn JS variables into PHP compliant variables

		$expr = str_replace("price", "\$price", $expr);
		$expr = str_replace("vat", "\$vat", $expr);
		$expr = str_replace("currency", "\$currency", $expr);
		$expr = str_replace("weight", "\$weight", $expr); // $weight AND $weightunit (both starts with "weight")

		// Evaluate shipping expense expression

		$shippingExpense = eval($expr);

		if (is_numeric($shippingExpense) === false)
		{
			header("HTTP/1.1 500 Internal Server Error");
			echo "ShippingExpenseExpression did not result in a valid numeric value";
			exit;
		}

		$priceTotal += $shippingExpense;

		if ($shippingExpenseVatPercentage !== null && $shippingExpenseVatPercentage !== "")
		{
			$shippingVat = $shippingExpense * ((float)$shippingExpenseVatPercentage / 100);
			$vatTotal += $shippingVat;
		}
	}

	// Update order details

	$order["Id"] = (string)$orderId;
	$order["Price"] = (string)$priceTotal;
	$order["Vat"] = (string)$vatTotal;
	$order["Currency"] = $currency;
	$order["Weight"] = (string)$weightTotal;
	$order["WeightUnit"] = $weightUnit;
	$order["ShippingExpense"] = (string)$shippingExpense;
	$order["ShippingVat"] = (string)$shippingVat;
	$order["ShippingMessage"] = (($shippingExpenseMessage !== null) ? $shippingExpenseMessage : "");
	$order["TransactionId"] = "";
	$order["State"] = "Initial";
}

?>
